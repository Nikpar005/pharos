// Small wrappers around device features. Each one degrades gracefully: if a
// phone or browser doesn't support something, the app keeps working without it.

/** True inside the Play Store app (Capacitor), false in a browser. */
export function isNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

// ---- Screen wake lock: keeps the screen on while a tool runs ----------------

type WakeLockSentinel = { release: () => Promise<void> };

export async function keepScreenOn(): Promise<() => void> {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinel> } }).wakeLock;
    const sentinel = await wl?.request('screen');
    return () => {
      sentinel?.release().catch(() => undefined);
    };
  } catch {
    return () => undefined;
  }
}

// ---- Sound: whistle and metronome, generated (no audio files to download) --

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, volume: number, type: OscillatorType) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // Short fades avoid clicks; the body of the tone is at full volume.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.setValueAtTime(volume, start + duration - 0.02);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration);
}

/**
 * Distress whistle: three blasts, then a pause, repeated. Around 3 kHz,
 * where phone speakers are loud and human hearing is most sensitive.
 */
export function startWhistle(): () => void {
  const ac = audio();
  if (!ac) return () => undefined;
  let stopped = false;
  const cycle = () => {
    if (stopped) return;
    const t = ac.currentTime + 0.05;
    for (let i = 0; i < 3; i++) tone(ac, 3150, t + i * 1.2, 0.8, 0.9, 'square');
    timer = window.setTimeout(cycle, 3 * 1200 + 3000);
  };
  let timer = 0;
  cycle();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

/** Metronome clicks at `bpm`; calls onBeat on every click (for the counter). */
export function startMetronome(bpm: number, onBeat: () => void): () => void {
  const ac = audio();
  const interval = 60 / bpm;
  let next = ac ? ac.currentTime + 0.1 : 0;
  let stopped = false;
  let timer = 0;
  // Schedule a little ahead on the audio clock: steady even if the page is busy.
  const schedule = () => {
    if (stopped) return;
    if (ac) {
      while (next < ac.currentTime + 0.2) {
        tone(ac, 1000, next, 0.05, 0.8, 'sine');
        const delay = Math.max(0, (next - ac.currentTime) * 1000);
        window.setTimeout(() => !stopped && onBeat(), delay);
        next += interval;
      }
      timer = window.setTimeout(schedule, 50);
    } else {
      onBeat();
      timer = window.setTimeout(schedule, interval * 1000);
    }
  };
  schedule();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

// ---- Torch (flashlight) -------------------------------------------------------

export interface Torch {
  set: (on: boolean) => Promise<void>;
  release: () => void;
}

/**
 * The phone's flashlight, or null when it can't be controlled.
 * App: Capacitor torch plugin. Browser: camera torch (Android Chrome only).
 */
export async function getTorch(): Promise<Torch | null> {
  if (isNative()) {
    try {
      const { Torch } = await import('@capawesome/capacitor-torch');
      if (!(await Torch.isAvailable()).available) return null;
      return {
        set: async (on) => {
          await (on ? Torch.enable() : Torch.disable());
        },
        release: () => void Torch.disable().catch(() => undefined)
      };
    } catch {
      return null;
    }
  }
  try {
    if (!navigator.mediaDevices?.getUserMedia) return null;
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const track = stream.getVideoTracks()[0];
    const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined;
    if (!track || !caps?.torch) {
      stream.getTracks().forEach((t) => t.stop());
      return null;
    }
    return {
      set: (on) => track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }),
      release: () => stream.getTracks().forEach((t) => t.stop())
    };
  } catch {
    return null;
  }
}

/** Morse SOS (··· ––– ···) as [on, durationInUnits] pairs, then a word gap. */
export const SOS_PATTERN: [boolean, number][] = (() => {
  const out: [boolean, number][] = [];
  const letter = (units: number) => {
    for (let i = 0; i < 3; i++) {
      out.push([true, units]);
      out.push([false, i < 2 ? 1 : 3]);
    }
  };
  letter(1); // S
  letter(3); // O
  letter(1); // S
  out[out.length - 1] = [false, 7];
  return out;
})();
