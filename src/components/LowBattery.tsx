import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { watchBattery, type BatterySnapshot } from '../lib/battery';
import { href } from '../router';

/** Shown on Home only when the battery is under 20% and not charging. */
export function LowBattery() {
  const { t } = useStore();
  const [snap, setSnap] = useState<BatterySnapshot | null>(null);
  useEffect(() => {
    let stop: (() => void) | null = null;
    watchBattery(setSnap).then((u) => (stop = u));
    return () => stop?.();
  }, []);
  if (!snap || snap.charging || snap.level >= 0.2) return null;
  return (
    <a class="banner banner-warn" href={href('battery')}>
      <strong>{t('battery.low', { pct: Math.round(snap.level * 100) })}</strong>
      <span>{t('battery.lowTips')}</span>
    </a>
  );
}
