// Battery information.
//   level / charging / time left: Battery Status API (Chrome & Android WebView;
//     not available in Safari or Firefox).
//   live current in mA: only inside the Android app, via the small native
//     plugin in android/app/src/main/java/.../BatteryInfoPlugin.java.
import { isNative } from './device';

export interface BatterySnapshot {
  level: number; // 0..1
  charging: boolean;
  /** Seconds until empty as reported by the system, if known. */
  dischargingTime: number | null;
}

interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
  dischargingTime: number;
}

let manager: Promise<BatteryManagerLike | null> | null = null;
function getManager(): Promise<BatteryManagerLike | null> {
  manager ??= (async () => {
    const nav = navigator as unknown as { getBattery?: () => Promise<BatteryManagerLike> };
    try {
      return nav.getBattery ? await nav.getBattery() : null;
    } catch {
      return null;
    }
  })();
  return manager;
}

function snapshot(b: BatteryManagerLike): BatterySnapshot {
  return {
    level: b.level,
    charging: b.charging,
    dischargingTime: Number.isFinite(b.dischargingTime) && b.dischargingTime > 0 ? b.dischargingTime : null
  };
}

/** Calls `cb` now and on every change. Returns an unsubscribe function, or null if unsupported. */
export async function watchBattery(cb: (s: BatterySnapshot) => void): Promise<(() => void) | null> {
  const b = await getManager();
  if (!b) return null;
  const on = () => cb(snapshot(b));
  on();
  for (const ev of ['levelchange', 'chargingchange', 'dischargingtimechange']) b.addEventListener(ev, on);
  return () => {
    for (const ev of ['levelchange', 'chargingchange', 'dischargingtimechange']) b.removeEventListener(ev, on);
  };
}

export interface NativeBattery {
  /** Instantaneous current in mA. Negative = discharging (on most phones). */
  currentMa: number | null;
  voltageMv: number | null;
  temperatureC: number | null;
}

/** Live electrical readings, only inside the Android app. */
export async function readNativeBattery(): Promise<NativeBattery | null> {
  if (!isNative()) return null;
  try {
    const { registerPlugin } = await import('@capacitor/core');
    const plugin = registerPlugin<{ read: () => Promise<NativeBattery> }>('BatteryInfo');
    return await plugin.read();
  } catch {
    return null;
  }
}

/**
 * Drain rate in %/hour from level samples taken over time. The Battery API
 * only reports whole percent steps, so this needs a few minutes of data.
 */
export function drainRate(samples: { t: number; level: number }[]): number | null {
  if (samples.length < 2) return null;
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  const hours = (last.t - first.t) / 3_600_000;
  const drop = (first.level - last.level) * 100;
  if (hours < 1 / 60 || drop <= 0) return null;
  return drop / hours;
}

/** Hours left from a known drain rate (%/h) and the current level (0..1). */
export function hoursLeft(level: number, ratePerHour: number | null): number | null {
  if (!ratePerHour || ratePerHour <= 0) return null;
  return (level * 100) / ratePerHour;
}
