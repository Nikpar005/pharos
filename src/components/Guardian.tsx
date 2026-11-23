import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from './Icon';
import { watchTaps } from '../lib/guardian';
import { beep, getTorch, keepScreenOn, startSiren, type Torch } from '../lib/device';
import { getPosition, formatCoords, mapLink, type Coords } from '../lib/geo';
import { buildSmsLink, detectPlatform } from '../lib/sms';
import { logEvent } from '../lib/eventlog';

const ASK_SECONDS = 5;
const ALARM_SECONDS = 20;

type Stage = 'idle' | 'ask' | 'alarm' | 'call';

/** Start the check from anywhere (Settings → "Test"). */
export function triggerGuardian(test: boolean): void {
  window.dispatchEvent(new CustomEvent('pharos:guardian', { detail: { test } }));
}

/**
 * "Are you okay?"
 *   1. 5 s countdown with beeps: one tap on "I'm okay" stops everything.
 *   2. 20 s loud siren + flashing torch/screen, to get people nearby.
 *   3. Opens the phone's dialer with 112 and offers an SMS with the GPS
 *      position to the family contacts. Phones never let an app call 112
 *      by itself, so a person still has to press "call" — which also means a
 *      false alarm can never become a real 112 call on its own.
 */
export function Guardian() {
  const { t, settings, plan } = useStore();
  const [stage, setStage] = useState<Stage>('idle');
  const [test, setTest] = useState(false);
  const [left, setLeft] = useState(ASK_SECONDS);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [lit, setLit] = useState(false);
  const torch = useRef<Torch | null>(null);

  const start = (isTest: boolean) => {
    setTest(isTest);
    setLeft(ASK_SECONDS);
    setStage('ask');
    getPosition(15000).then(setCoords, () => undefined);
  };
  const stop = () => setStage('idle');

  // Listen for erratic tapping (only when the user turned this on) and for tests.
  useEffect(() => {
    const onEvent = (e: Event) => start(!!(e as CustomEvent).detail?.test);
    window.addEventListener('pharos:guardian', onEvent);
    const stopWatching = settings.guardian ? watchTaps(() => start(false)) : () => {};
    return () => {
      window.removeEventListener('pharos:guardian', onEvent);
      stopWatching();
    };
  }, [settings.guardian]);

  // Stage 1: countdown.
  useEffect(() => {
    if (stage !== 'ask') return;
    beep();
    if (left <= 0) {
      setLeft(ALARM_SECONDS);
      setStage('alarm');
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [stage, left]);

  // Stages 2–3: siren, flashing light, screen on.
  useEffect(() => {
    if (stage !== 'alarm' && stage !== 'call') return;
    const stopSiren = startSiren();
    let release = () => {};
    keepScreenOn().then((r) => (release = r));
    let flash = 0;
    let on = false;
    getTorch().then((tr) => (torch.current = tr));
    flash = window.setInterval(() => {
      on = !on;
      setLit(on);
      torch.current?.set(on).catch(() => undefined);
    }, 400);
    if (!test) logEvent('note', 'Pharos: "Are you okay?" alarm');
    return () => {
      stopSiren();
      clearInterval(flash);
      torch.current?.set(false).catch(() => undefined);
      torch.current?.release();
      torch.current = null;
      setLit(false);
      release();
    };
  }, [stage === 'alarm' || stage === 'call']);

  // Stage 2 countdown, then stage 3.
  useEffect(() => {
    if (stage !== 'alarm') return;
    if (left <= 0) {
      setStage('call');
      if (!test) {
        logEvent('call-112');
        // Opens the dialer with 112 filled in (where the phone allows it).
        try {
          window.location.href = 'tel:112';
        } catch {
          /* buttons below still work */
        }
      }
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [stage, left]);

  if (stage === 'idle') return null;

  const body = `${t('guardian.smsBody')}${coords ? `\n${formatCoords(coords)} ${mapLink(coords)}` : ''}`;
  const phones = plan.contacts.map((c) => c.phone).filter((p) => p.trim());
  const sms = phones.length ? buildSmsLink(phones, body, detectPlatform(navigator.userAgent, navigator.maxTouchPoints)) : null;

  return (
    <div class={stage === 'ask' ? 'guardian ask' : lit ? 'guardian alarm lit' : 'guardian alarm'} role="alertdialog" aria-modal="true" aria-labelledby="g-title">
      {test && <span class="guardian-test">{t('guardian.test')}</span>}
      {stage === 'ask' ? (
        <>
          <h1 id="g-title" class="guardian-title">
            {t('guardian.ask')}
          </h1>
          <span class="guardian-count">{left}</span>
          <p class="guardian-sub">{t('guardian.askSub')}</p>
        </>
      ) : (
        <>
          <h1 id="g-title" class="guardian-title">
            {t('guardian.help')}
          </h1>
          <p class="guardian-sub">{t('guardian.helpEn')}</p>
          {stage === 'alarm' && <span class="guardian-count">{left}</span>}
          {coords && <p class="guardian-coords">{formatCoords(coords)}</p>}
          <a class="btn btn-danger guardian-btn" href="tel:112">
            <Icon name="phone" size={24} />
            <span>{t('guardian.call')}</span>
          </a>
          {sms && (
            <a class="btn btn-safe guardian-btn" href={sms}>
              <Icon name="message" size={22} />
              <span>{t('guardian.sms')}</span>
            </a>
          )}
        </>
      )}
      <button class="btn guardian-ok" onClick={stop}>
        {t('guardian.okay')}
      </button>
    </div>
  );
}
