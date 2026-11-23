// Spoken prompts with the phone's own text-to-speech: works offline, 0 KB.
// If the phone has no voice for the language, we stay silent (the screen and
// the metronome still guide the user).

function voiceFor(lang: string): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

export function canSpeak(lang: string): boolean {
  return voiceFor(lang) !== null;
}

export function speak(text: string, lang: string): void {
  try {
    const v = voiceFor(lang);
    if (!v) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v;
    u.lang = v.lang;
    u.rate = 1.05;
    u.volume = 1;
    speechSynthesis.speak(u);
  } catch {
    /* no speech: fine */
  }
}

export function stopSpeaking(): void {
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/** Voices load asynchronously on some phones; call once early. */
export function warmUpVoices(): void {
  try {
    speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
}
