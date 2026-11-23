// Builds an `sms:` link that opens the phone's own messaging app with the
// recipients and text filled in. The user still presses send: a web app
// cannot send SMS by itself, and that is a feature (nothing leaves the phone
// without the user's say-so).
//
// Platform quirks (there is no single standard):
//   Android: sms:+3069...,+3069...?body=...
//   iOS 11+: one recipient  sms:+3069...&body=...
//            many          sms:/open?addresses=+3069...,+3069...&body=...

export type Platform = 'ios' | 'android' | 'other';

export function detectPlatform(ua: string, maxTouchPoints = 0): Platform {
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  // iPadOS 13+ reports itself as a Mac.
  if (/macintosh/i.test(ua) && maxTouchPoints > 1) return 'ios';
  return 'other';
}

/** Keeps digits and a leading +, which is all an sms: link may contain. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') || trimmed.startsWith('00');
  const digits = trimmed.replace(/^00/, '').replace(/\D/g, '');
  return digits ? (plus ? '+' : '') + digits : '';
}

export function buildSmsLink(phones: string[], body: string, platform: Platform): string {
  const to = phones.map(normalizePhone).filter(Boolean);
  const text = encodeURIComponent(body);
  if (platform === 'ios') {
    if (to.length > 1) return `sms:/open?addresses=${to.join(',')}&body=${text}`;
    return `sms:${to[0] ?? ''}&body=${text}`;
  }
  return `sms:${to.join(',')}?body=${text}`;
}
