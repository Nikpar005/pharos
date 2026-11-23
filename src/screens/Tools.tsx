import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, BackLink, CallButton, DraftBanner, SectionTitle } from '../components/ui';
import { getProcedure, pick, type Procedure } from '../content';
import { keepScreenOn, startMetronome, startWhistle, getTorch, SOS_PATTERN, type Torch } from '../lib/device';
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

// ---- CPR with metronome ----------------------------------------------------------

export function Cpr() {
  const { t, lang } = useStore();
  const p = getProcedure('cpr');
  const text = pick(p.locales, lang);
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!on) return;
    setCount(0);
    const stop = startMetronome(110, () => {
      setCount((c) => (c % 30) + 1);
      setPulse((x) => !x);
    });
    let release = () => {};
    keepScreenOn().then((r) => (release = r));
    return () => {
      stop();
      release();
    };
  }, [on]);

  return (
    <Screen footer={<CallButton compact />}>
      <BackLink />
      <h1 class="title-l">{text.title}</h1>
      {p.status === 'draft' && <DraftBanner />}
      <p class="lead">{text.intro}</p>

      {on ? (
        <div class="metronome" aria-live="off">
          <div class={pulse ? 'beat a' : 'beat b'}>
            <span class="beat-count">{count}</span>
            <span class="beat-of">/ 30</span>
          </div>
          <p class="center muted">{t('cpr.pushOnBeat')}</p>
          <button class="btn btn-outline" onClick={() => setOn(false)}>
            {t('cpr.stop')}
          </button>
        </div>
      ) : (
        <button class="btn btn-primary" onClick={() => setOn(true)}>
          {t('cpr.start')}
        </button>
      )}

      <SectionTitle>{t('cpr.steps')}</SectionTitle>
      <Steps p={p} />
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

// ---- Family drill -----------------------------------------------------------------

const DRILL_STEPS = ['drill.s1', 'drill.s2', 'drill.s3', 'drill.s4', 'drill.s5'] as const;

export function Drill() {
  const { t, lang, settings, setSettings } = useStore();
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const allDone = DRILL_STEPS.every((_, i) => done[i]);

  useEffect(() => {
    if (!started || allDone) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started, allDone]);

  useEffect(() => {
    if (allDone && started) setSettings({ lastDrillAt: new Date().toISOString().slice(0, 10) });
  }, [allDone]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <Screen tab="plan">
      <BackLink />
      <h1 class="title-l">{t('drill.title')}</h1>
      <p class="lead">{t('drill.sub')}</p>
      {settings.lastDrillAt && (
        <p class="muted">{t('drill.last', { date: new Date(settings.lastDrillAt).toLocaleDateString(lang) })}</p>
      )}
      {!started ? (
        <button class="btn btn-primary" onClick={() => setStarted(true)}>
          {t('drill.start')}
        </button>
      ) : (
        <div class="timer" aria-live="off">
          {mm}:{ss}
        </div>
      )}
      <div class="list">
        {DRILL_STEPS.map((k, i) => (
          <label key={k} class={done[i] ? 'list-row check-row done' : 'list-row check-row'}>
            <input
              type="checkbox"
              disabled={!started}
              checked={!!done[i]}
              onChange={(e) => setDone({ ...done, [i]: e.currentTarget.checked })}
            />
            <span class="list-title">{t(k)}</span>
          </label>
        ))}
      </div>
      {allDone && started && (
        <p class="banner banner-ok" role="status">
          {t('drill.done', { time: `${mm}:${ss}` })}
        </p>
      )}
      <a class="btn btn-ghost" href={href('plan')}>
        {t('drill.openPlan')}
      </a>
    </Screen>
  );
}
