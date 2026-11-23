import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Screen, BackLink, SectionTitle } from '../components/ui';
import { drainRate, hoursLeft, readNativeBattery, watchBattery, type BatterySnapshot, type NativeBattery } from '../lib/battery';
import { isNative } from '../lib/device';

const TIPS = ['battery.tip1', 'battery.tip2', 'battery.tip3', 'battery.tip4', 'battery.tip5'] as const;

function fmtHours(h: number, lang: string): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return lang === 'el' ? `${hh} ώ ${mm} λ` : `${hh} h ${mm} min`;
}

/**
 * Public part: level, estimated time left, tips for saving battery.
 * Developer part (7 taps on the logo): raw readings and, in the Android app,
 * live current in mA every second.
 */
export function Battery() {
  const { t, lang, settings, setSettings } = useStore();
  const [snap, setSnap] = useState<BatterySnapshot | null>(null);
  const [supported, setSupported] = useState(true);
  const [native, setNative] = useState<NativeBattery | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const samples = useRef<{ t: number; level: number }[]>([]);

  useEffect(() => {
    let stop: (() => void) | null = null;
    watchBattery((s) => {
      setSnap(s);
      if (!s.charging) samples.current.push({ t: Date.now(), level: s.level });
      else samples.current = [];
    }).then((u) => {
      stop = u;
      if (!u) setSupported(false);
    });
    return () => stop?.();
  }, []);

  // Live current: only while this screen is open in developer mode, inside the app.
  useEffect(() => {
    if (!settings.devMode || !isNative()) return;
    const id = window.setInterval(async () => {
      const r = await readNativeBattery();
      setNative(r);
      if (r?.currentMa != null) setHistory((h) => [...h.slice(-59), r.currentMa!]);
    }, 1000);
    return () => clearInterval(id);
  }, [settings.devMode]);

  const rate = drainRate(samples.current);
  const left = snap ? (snap.dischargingTime ? snap.dischargingTime / 3600 : hoursLeft(snap.level, rate)) : null;
  const avgMa = history.length ? history.reduce((a, b) => a + b, 0) / history.length : null;

  return (
    <Screen>
      <BackLink />
      <h1 class="title-l">{t('battery.title')}</h1>

      {!supported && <p class="alert">{t('battery.unsupported')}</p>}
      {snap && (
        <div class="coords-card">
          <span class="coords">{Math.round(snap.level * 100)}%</span>
          <span class="muted">
            {snap.charging
              ? t('battery.charging')
              : left
                ? t('battery.left', { time: fmtHours(left, lang) })
                : t('battery.measuring')}
          </span>
        </div>
      )}

      <SectionTitle>{t('battery.tipsTitle')}</SectionTitle>
      <ol class="steps">
        {TIPS.map((k, i) => (
          <li key={k}>
            <span class="step-n">{i + 1}</span>
            <span>{t(k)}</span>
          </li>
        ))}
      </ol>

      {settings.devMode && (
        <section class="card stack dev">
          <h2 class="title-s">{t('battery.dev')}</h2>
          <dl class="kv">
            <dt>level</dt>
            <dd>{snap ? snap.level.toFixed(2) : '—'}</dd>
            <dt>charging</dt>
            <dd>{snap ? String(snap.charging) : '—'}</dd>
            <dt>dischargingTime</dt>
            <dd>{snap?.dischargingTime ? `${Math.round(snap.dischargingTime / 60)} min` : '—'}</dd>
            <dt>drain (measured)</dt>
            <dd>{rate ? `${rate.toFixed(1)} %/h` : '—'}</dd>
            <dt>current now</dt>
            <dd>{native?.currentMa != null ? `${native.currentMa} mA` : isNative() ? '—' : t('battery.appOnly')}</dd>
            <dt>current avg (60 s)</dt>
            <dd>{avgMa != null ? `${Math.round(avgMa)} mA` : '—'}</dd>
            <dt>voltage</dt>
            <dd>{native?.voltageMv != null ? `${(native.voltageMv / 1000).toFixed(2)} V` : '—'}</dd>
            <dt>temperature</dt>
            <dd>{native?.temperatureC != null ? `${native.temperatureC.toFixed(1)} °C` : '—'}</dd>
          </dl>
          {history.length > 1 && <Sparkline values={history} />}
          <p class="fineprint">{t('battery.devNote')}</p>
          <button class="btn btn-small btn-ghost" onClick={() => setSettings({ devMode: false })}>
            {t('battery.devOff')}
          </button>
        </section>
      )}
    </Screen>
  );
}

function Sparkline(props: { values: number[] }) {
  const v = props.values.map(Math.abs);
  const max = Math.max(...v, 1);
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 300},${60 - (x / max) * 56}`).join(' ');
  return (
    <svg viewBox="0 0 300 60" class="spark" role="img" aria-label={`max ${Math.round(max)} mA`}>
      <polyline points={pts} fill="none" stroke="currentColor" stroke-width="2" />
    </svg>
  );
}
