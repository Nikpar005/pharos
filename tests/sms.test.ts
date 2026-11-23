import { describe, expect, it } from 'vitest';
import { buildSmsLink, detectPlatform, normalizePhone } from '../src/lib/sms';

describe('normalizePhone', () => {
  it('keeps digits and a leading +', () => {
    expect(normalizePhone(' +30 694 123 4567 ')).toBe('+306941234567');
    expect(normalizePhone('(210) 123-4567')).toBe('2101234567');
  });
  it('turns a 00 prefix into +', () => {
    expect(normalizePhone('0030 6941234567')).toBe('+306941234567');
  });
  it('returns empty for junk', () => {
    expect(normalizePhone('abc')).toBe('');
  });
});

describe('detectPlatform', () => {
  it('detects Android and iPhone', () => {
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 9; SM-G960F)')).toBe('android');
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('ios');
  });
  it('treats a touch "Mac" as an iPad', () => {
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe('ios');
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe('other');
  });
});

describe('buildSmsLink', () => {
  const body = 'Είμαι καλά & ασφαλής';
  const enc = encodeURIComponent(body);

  it('Android: comma-separated recipients and ?body=', () => {
    expect(buildSmsLink(['+30 694 000 0001', '6940000002'], body, 'android')).toBe(
      `sms:+306940000001,6940000002?body=${enc}`
    );
  });
  it('iOS, one recipient: &body=', () => {
    expect(buildSmsLink(['+306940000001'], body, 'ios')).toBe(`sms:+306940000001&body=${enc}`);
  });
  it('iOS, many recipients: /open?addresses=', () => {
    expect(buildSmsLink(['+306940000001', '+306940000002'], body, 'ios')).toBe(
      `sms:/open?addresses=+306940000001,+306940000002&body=${enc}`
    );
  });
  it('drops numbers that are empty after cleaning', () => {
    expect(buildSmsLink(['', 'x', '6940000001'], 'hi', 'android')).toBe('sms:6940000001?body=hi');
  });
  it('encodes newlines and reserved characters in the body', () => {
    expect(buildSmsLink(['1'], 'a\nb?c=d', 'android')).toBe('sms:1?body=a%0Ab%3Fc%3Dd');
  });
});
