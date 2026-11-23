import { describe, expect, it } from 'vitest';
import { isErratic, MIN_TAPS, WINDOW_MS, type Tap } from '../src/lib/guardian';
import { nearest, type PoiFile } from '../src/lib/pois';
import { readiness } from '../src/lib/readiness';
import { duration } from '../src/lib/eventlog';
import { emptyPlan } from '../src/lib/plan';
import { defaultSettings } from '../src/lib/storage';

const taps = (n: number, interactive: boolean, every = 200, start = 0): Tap[] =>
  Array.from({ length: n }, (_, i) => ({ t: start + i * every, interactive }));

describe('"Are you okay?" detection', () => {
  it('ignores normal use, even fast tapping on real buttons', () => {
    expect(isErratic(taps(12, true), 12 * 200)).toBe(false);
  });
  it('ignores a few random taps', () => {
    expect(isErratic(taps(MIN_TAPS - 1, false), (MIN_TAPS - 1) * 200)).toBe(false);
  });
  it('triggers on many fast taps on nothing', () => {
    expect(isErratic(taps(MIN_TAPS, false), MIN_TAPS * 200)).toBe(true);
  });
  it('only counts the recent window', () => {
    const old = taps(MIN_TAPS, false, 100, 0);
    expect(isErratic(old, WINDOW_MS + 10_000)).toBe(false);
  });
  it('triggers on a mix that is mostly misses', () => {
    const mix = [...taps(7, false, 200), ...taps(4, true, 200, 1400)];
    expect(isErratic(mix, 2400)).toBe(true);
  });
});

describe('nearest places', () => {
  const file: PoiFile = {
    v: 1,
    generated: '2026-11-23',
    items: [
      ['pharmacy', 37.97, 23.73, 'Near', ''],
      ['pharmacy', 38.2, 23.9, 'Far', ''],
      ['pharmacy', 37.971, 23.731, 'Nearest', '210'],
      ['hospital', 37.98, 23.74, 'Hosp', ''],
      ['pharmacy', 37.9, 23.6, 'Mid', '']
    ]
  };
  it('returns the closest per category, sorted', () => {
    const r = nearest([file], { lat: 37.9711, lon: 23.7311 }, 2);
    expect(r.pharmacy.map((p) => p.name)).toEqual(['Nearest', 'Near']);
    expect(r.hospital).toHaveLength(1);
    expect(r.police).toEqual([]);
    expect(r.pharmacy[0]!.meters).toBeLessThan(50);
  });
  it('works across several region files', () => {
    const other: PoiFile = { v: 1, generated: '', items: [['police', 37.9712, 23.7312, 'Cop', '']] };
    expect(nearest([file, other], { lat: 37.9711, lon: 23.7311 }).police[0]!.name).toBe('Cop');
  });
});

describe('readiness score', () => {
  const base = { plan: emptyPlan(), kit: { checked: {} }, kitTotal: 16, settings: defaultSettings(), mapsDownloaded: 0, now: Date.parse('2026-11-23') };
  it('is 0 for a fresh install', () => {
    expect(readiness(base).score).toBe(0);
  });
  it('is 100 when everything is done', () => {
    const plan = emptyPlan();
    plan.contacts.push({ id: 'a', name: 'Mum', phone: '6940000000', checkIn: true });
    plan.near = { label: 'Square', coords: { lat: 1, lon: 1 } };
    plan.outOfArea = { name: 'Aunt', phone: '2100000000' };
    const checked = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`k${i}`, true]));
    const settings = { ...defaultSettings(), lastDrillAt: '2026-10-01', phoneSetupDone: true };
    expect(readiness({ ...base, plan, kit: { checked }, settings, mapsDownloaded: 1 }).score).toBe(100);
  });
  it('an old drill does not count', () => {
    const settings = { ...defaultSettings(), lastDrillAt: '2025-01-01' };
    expect(readiness({ ...base, settings }).items.find((i) => i.id === 'drill')!.points).toBe(0);
  });
});

describe('durations', () => {
  it('formats m:ss', () => {
    expect(duration(0)).toBe('0:00');
    expect(duration(65_000)).toBe('1:05');
    expect(duration(125_900)).toBe('2:05');
  });
});
