import { describe, expect, it } from 'vitest';
import { decodePlan, emptyPlan, encodePlan, sanitizePlan, shareUrl, type Plan } from '../src/lib/plan';

const plan: Plan = {
  v: 1,
  contacts: [
    { id: 'a', name: 'Μαμά', phone: '+30 694 000 0001', checkIn: true },
    { id: 'b', name: 'Γιώργος', phone: '6940000002', checkIn: false }
  ],
  near: { label: 'Πλατεία της γειτονιάς', coords: { lat: 37.97561, lon: 23.73478 } },
  far: { label: 'Σπίτι γιαγιάς' },
  outOfArea: { name: 'Θεία Ελένη', phone: '+357 99 000000' },
  members: [{ id: 'm', name: 'Νίκος', needs: 'Αλλεργία στην πενικιλίνη' }]
};

const strip = (p: Plan) => ({
  ...p,
  contacts: p.contacts.map(({ id: _id, ...c }) => c),
  members: p.members.map(({ id: _id, ...m }) => m)
});

describe('encodePlan / decodePlan', () => {
  it('round-trips a plan (compressed)', async () => {
    const data = await encodePlan(plan);
    expect(data.startsWith('z.')).toBe(true);
    expect(data).toMatch(/^z\.[A-Za-z0-9_-]+$/); // URL-safe, no padding
    const back = await decodePlan(data);
    expect(back).not.toBeNull();
    expect(strip(back!)).toEqual(strip(plan));
  });

  it('decodes the uncompressed fallback format', async () => {
    const json = JSON.stringify({ ...plan });
    const b64 = Buffer.from(json, 'utf8').toString('base64url');
    const back = await decodePlan('j.' + b64);
    expect(back?.near.label).toBe('Πλατεία της γειτονιάς');
  });

  it('keeps the share link short enough for a QR code', async () => {
    const url = shareUrl('https://nikpar005.github.io', '/pharos/', await encodePlan(plan));
    expect(url).toContain('/pharos/#/import/z.');
    expect(url.length).toBeLessThan(1200);
  });

  it('rejects garbage instead of throwing', async () => {
    expect(await decodePlan('')).toBeNull();
    expect(await decodePlan('z.not-real-data')).toBeNull();
    expect(await decodePlan('x.abc')).toBeNull();
    expect(await decodePlan('j.' + Buffer.from('{"v":2}').toString('base64url'))).toBeNull();
  });
});

describe('sanitizePlan', () => {
  it('fills in missing fields', () => {
    expect(sanitizePlan({ v: 1 })).toEqual(emptyPlan());
  });
  it('drops invalid coordinates and wrong types', () => {
    const p = sanitizePlan({
      v: 1,
      near: { label: 5, coords: { lat: 999, lon: 0 } },
      far: { label: 'ok', coords: { lat: '1', lon: 2 } },
      contacts: 'nope',
      members: [{ name: { evil: true }, needs: 'x' }]
    });
    expect(p?.near).toEqual({ label: '' });
    expect(p?.far).toEqual({ label: 'ok' });
    expect(p?.contacts).toEqual([]);
    expect(p?.members[0]?.name).toBe('');
  });
  it('caps list sizes and string lengths', () => {
    const p = sanitizePlan({
      v: 1,
      contacts: Array.from({ length: 50 }, () => ({ name: 'x'.repeat(500), phone: '1' })),
      outOfArea: { name: 'y'.repeat(500), phone: '2' }
    });
    expect(p?.contacts.length).toBe(20);
    expect(p?.contacts[0]?.name.length).toBe(60);
    expect(p?.outOfArea.name.length).toBe(60);
  });
  it('rejects unknown versions', () => {
    expect(sanitizePlan({ v: 2 })).toBeNull();
    expect(sanitizePlan(null)).toBeNull();
  });
});
