// "Are you okay?" detection. If someone taps the screen many times, fast and
// mostly on places that do nothing, they may be confused, panicking or
// unwell. We then ask "Are you okay?" — we never call anyone without giving
// the person (and people nearby) time to stop it. Off by default.

export interface Tap {
  t: number; // ms
  interactive: boolean;
}

export const WINDOW_MS = 4000;
export const MIN_TAPS = 10;
export const MIN_MISS_RATIO = 0.6;

/** True when the recent taps look erratic rather than normal use. */
export function isErratic(taps: Tap[], now: number): boolean {
  const recent = taps.filter((x) => now - x.t <= WINDOW_MS);
  if (recent.length < MIN_TAPS) return false;
  const misses = recent.filter((x) => !x.interactive).length;
  return misses / recent.length >= MIN_MISS_RATIO;
}

const INTERACTIVE = 'a,button,input,select,textarea,label,summary,[role="button"],[role="tab"]';

/**
 * Watches taps anywhere in the app. Calls onTrigger at most once per cooldown.
 * Returns a function that stops watching.
 */
export function watchTaps(onTrigger: () => void, cooldownMs = 60_000): () => void {
  let taps: Tap[] = [];
  let last = 0;
  const handler = (e: PointerEvent) => {
    const now = Date.now();
    const target = e.target as Element | null;
    taps = [...taps.filter((x) => now - x.t <= WINDOW_MS), { t: now, interactive: !!target?.closest?.(INTERACTIVE) }];
    if (now - last > cooldownMs && isErratic(taps, now)) {
      last = now;
      taps = [];
      onTrigger();
    }
  };
  document.addEventListener('pointerdown', handler, { capture: true, passive: true });
  return () => document.removeEventListener('pointerdown', handler, { capture: true });
}
