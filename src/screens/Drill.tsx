import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Screen, BackLink } from '../components/ui';
import { href } from '../router';

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
