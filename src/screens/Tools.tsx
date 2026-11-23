import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, BackLink, CallButton, DraftBanner, SectionTitle } from '../components/ui';
import { getProcedure, pick, type Procedure } from '../content';
import { keepScreenOn, startMetronome, startWhistle, getTorch, beep, SOS_PATTERN, type Torch } from '../lib/device';
import { speak, stopSpeaking } from '../lib/voice';
import { logEvent, clock, duration } from '../lib/eventlog';
import { href } from '../router';

function Steps(props: { p: Procedure }) {
  const { lang, t } = useStore();
  const text = pick(props.p.locales, lang);
  return (
    <>
      <ol class="steps">
        {text.steps.map((s, i) => (
          <li key={i}>
            <span class="step-n">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div class="sources">
        {props.p.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
            {t('guide.source')}: {s.name} <Icon name="external" size={14} />
          </a>
        ))}
      </div>
    </>
  );
}

// ---- "I'm trapped": whistle + black screen ------------------------------------

export function Trapped() {
  const { t, lang } = useStore();
  const p = getProcedure('trapped');
  const text = pick(p.locales, lang);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    const stopSound = startWhistle();
    let release = () => {};
    keepScreenOn().then((r) => (release = r));
    return () => {
      stopSound();
      release();
    };
  }, [on]);

  if (on) {
    // Black screen: the least power an OLED screen can use while staying on.
    return (
      <div class="blackout" onClick={() => setOn(false)} role="button" tabIndex={0} aria-label={t('trapped.stop')}>
        <span class="blackout-label">{t('trapped.whistling')}</span>
        <span class="blackout-hint">{t('trapped.tapToStop')}</span>
      </div>
    );
  }

  return (
    <Screen footer={<CallButton compact />}>
      <BackLink />
      <h1 class="title-l">{text.title}</h1>
      {p.status === 'draft' && <DraftBanner />}
      <p class="lead">{text.intro}</p>
      <button class="btn btn-beacon" onClick={() => setOn(true)}>
        {t('trapped.start')}
      </button>
      <p class="fineprint">{t('trapped.volume')}</p>
      <Steps p={p} />
    </Screen>
  );
}

// ---- CPR: metronome, timer, 2-minute swaps, voice, event log ----------------

const BPM = 110;
const SWAP_MS = 2 * 60 * 1000;

export function Cpr() {
  const { t, lang, settings, setSettings } = useStore();
  const p = getProcedure('cpr');
  const text = pick(p.locales, lang);
  const [on, setOn] = useState(false);
  const [withBreaths, setWithBreaths] = useState(false);
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [pausedForBreaths, setPausedForBreaths] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [shocks, setShocks] = useState(0);
  const lastSwap = useRef(0);
  const say = (msg: string) => settings.voice && speak(msg, lang);

  // Metronome (restarted after every 2-breath pause in 30:2 mode).
  useEffect(() => {
    if (!on || pausedForBreaths) return;
    let n = 0;
    const stop = startMetronome(BPM, () => {
      n++;
      setCount(n);
      setPulse((x) => !x);
      if (withBreaths && n === 30) {
        setPausedForBreaths(true);
        say(t('cpr.sayBreaths'));
      }
    });
    return stop;
  }, [on, pausedForBreaths, withBreaths]);

  // 2 rescue breaths take about 5 seconds, then compressions resume.
  useEffect(() => {
    if (!pausedForBreaths) return;
    const id = window.setTimeout(() => {
      setCount(0);
      setPausedForBreaths(false);
      say(t('cpr.sayPush'));
    }, 5000);
    return () => clearTimeout(id);
  }, [pausedForBreaths]);

  // Clock, swap prompt every 2 minutes, screen kept on.
  useEffect(() => {
    if (!on) return;
    let release = () => {};
    keepScreenOn().then((r) => (release = r));
    const id = window.setInterval(() => {
      const tNow = Date.now();
      setNow(tNow);
      if (startedAt && tNow - lastSwap.current >= SWAP_MS) {
        lastSwap.current = tNow;
        beep(660, 0.4);
        say(t('cpr.saySwap'));
      }
    }, 1000);
    return () => {
      clearInterval(id);
      release();
    };
  }, [on, startedAt]);

  const start = () => {
    const at = Date.now();
    setStartedAt(at);
    lastSwap.current = at;
    setCount(0);
    setShocks(0);
    setOn(true);
    say(t('cpr.sayStart'));
    logEvent('cpr-start');
  };
  const stop = () => {
    setOn(false);
    setPausedForBreaths(false);
    stopSpeaking();
    logEvent('cpr-stop');
  };

  const elapsed = startedAt ? now - startedAt : 0;
  const nextSwap = SWAP_MS - ((now - lastSwap.current) % SWAP_MS);

  return (
    <Screen footer={<CallButton compact />}>
      <BackLink />
      <h1 class="title-l">{text.title}</h1>
      {p.status === 'draft' && <DraftBanner />}
      <p class="lead">{text.intro}</p>

      {on ? (
        <div class="metronome" aria-live="off">
          <div class="cpr-clock">
            <div>
              <span class="stat-label">{t('cpr.elapsed')}</span>
              <span class="stat-value">{duration(elapsed)}</span>
            </div>
            <div>
              <span class="stat-label">{t('cpr.startedAt')}</span>
              <span class="stat-value">{startedAt ? clock(new Date(startedAt).toISOString(), lang) : ''}</span>
            </div>
            <div>
              <span class="stat-label">{t('cpr.swapIn')}</span>
              <span class="stat-value">{duration(nextSwap)}</span>
            </div>
          </div>
          <div class={pausedForBreaths ? 'beat breaths' : pulse ? 'beat a' : 'beat b'}>
            {pausedForBreaths ? (
              <span class="beat-breaths">{t('cpr.breathsNow')}</span>
            ) : (
              <>
                <span class="beat-count">{count}</span>
                {withBreaths && <span class="beat-of">/ 30</span>}
              </>
            )}
          </div>
          <p class="center muted">{t('cpr.pushOnBeat')}</p>
          <div class="row-2">
            <button
              class="btn btn-outline"
              onClick={() => {
                setShocks((n) => n + 1);
                logEvent('aed-shock');
              }}
            >
              {t('cpr.shock')} {shocks > 0 ? `(${shocks})` : ''}
            </button>
            <button class="btn btn-primary" onClick={stop}>
              {t('cpr.stop')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div class="segmented two" role="radiogroup" aria-label={t('cpr.mode')}>
            <button role="radio" aria-checked={!withBreaths} class={!withBreaths ? 'on' : undefined} onClick={() => setWithBreaths(false)}>
              {t('cpr.modeHands')}
            </button>
            <button role="radio" aria-checked={withBreaths} class={withBreaths ? 'on' : undefined} onClick={() => setWithBreaths(true)}>
              {t('cpr.modeBreaths')}
            </button>
          </div>
          <label class="toggle-row">
            <span class="toggle-label">{t('cpr.voice')}</span>
            <input type="checkbox" checked={settings.voice} onChange={(e) => setSettings({ voice: e.currentTarget.checked })} />
          </label>
          <button class="btn btn-danger" onClick={start}>
            {t('cpr.start')}
          </button>
        </>
      )}

      <a class="btn btn-ghost" href={href('log')}>
        {t('log.open')}
      </a>

      <SectionTitle>{t('cpr.steps')}</SectionTitle>
      <Steps p={p} />
      <p class="fineprint">{t('cpr.afterCare')}</p>
    </Screen>
  );
}

// ---- SOS light ----------------------------------------------------------------------

const UNIT_MS = 300; // longest flash rhythm stays under 2 per second (photosensitivity)

export function Sos() {
  const { t } = useStore();
  const [accepted, setAccepted] = useState(false);
  const [running, setRunning] = useState(false);
  const [lit, setLit] = useState(false);
  const [torchState, setTorchState] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const torch = useRef<Torch | null>(null);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let timer = 0;
    let release = () => {};
    keepScreenOn().then((r) => (release = r));
    (async () => {
      torch.current = await getTorch();
      setTorchState(torch.current ? 'yes' : 'no');
      let i = 0;
      const step = () => {
        if (cancelled) return;
        const [on, units] = SOS_PATTERN[i % SOS_PATTERN.length]!;
        setLit(on);
        torch.current?.set(on).catch(() => undefined);
        i++;
        timer = window.setTimeout(step, units * UNIT_MS);
      };
      step();
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      torch.current?.set(false).catch(() => undefined);
      torch.current?.release();
      torch.current = null;
      release();
      setLit(false);
    };
  }, [running]);

  if (running) {
    return (
      <div class={lit ? 'sos-screen lit' : 'sos-screen'} onClick={() => setRunning(false)} role="button" tabIndex={0} aria-label={t('sos.stop')}>
        <span class="blackout-hint">
          {torchState === 'no' ? t('sos.screenOnly') : ''} {t('trapped.tapToStop')}
        </span>
      </div>
    );
  }

  return (
    <Screen>
      <BackLink />
      <h1 class="title-l">{t('sos.title')}</h1>
      <p class="lead">{t('sos.sub')}</p>
      <p class="draft" role="note">
        {t('sos.warning')}
      </p>
      <label class="toggle-row">
        <span class="toggle-label">{t('sos.accept')}</span>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.currentTarget.checked)} />
      </label>
      <button class="btn btn-primary" disabled={!accepted} onClick={() => setRunning(true)}>
        {t('sos.start')}
      </button>
    </Screen>
  );
}

