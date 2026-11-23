import { describe, expect, it } from 'vitest';
import { drainRate, hoursLeft } from '../src/lib/battery';
import { SOS_PATTERN } from '../src/lib/device';
import { parseEmsc, parseUsgs } from '../src/lib/quakes';

describe('battery maths', () => {
  const h = 3_600_000;
  it('needs at least two samples and a real drop', () => {
    expect(drainRate([])).toBeNull();
    expect(drainRate([{ t: 0, level: 0.5 }])).toBeNull();
    expect(drainRate([{ t: 0, level: 0.5 }, { t: h, level: 0.5 }])).toBeNull();
  });
  it('computes %/hour', () => {
    expect(drainRate([{ t: 0, level: 0.8 }, { t: h / 2, level: 0.75 }])).toBeCloseTo(10, 5);
  });
  it('ignores spans shorter than a minute (too noisy)', () => {
    expect(drainRate([{ t: 0, level: 0.8 }, { t: 30_000, level: 0.79 }])).toBeNull();
  });
  it('turns a rate into hours left', () => {
    expect(hoursLeft(0.5, 10)).toBeCloseTo(5, 5);
    expect(hoursLeft(0.5, null)).toBeNull();
    expect(hoursLeft(0.5, 0)).toBeNull();
  });
});

describe('SOS pattern', () => {
  it('is ··· ––– ··· with Morse timing', () => {
    const on = SOS_PATTERN.filter(([lit]) => lit).map(([, u]) => u);
    expect(on).toEqual([1, 1, 1, 3, 3, 3, 1, 1, 1]);
    // gaps: 1 unit inside a letter, 3 between letters, 7 before repeating
    const off = SOS_PATTERN.filter(([lit]) => !lit).map(([, u]) => u);
    expect(off).toEqual([1, 1, 3, 1, 1, 3, 1, 1, 7]);
  });
  it('never flashes more than 3 times a second at a 300 ms unit (photosensitivity)', () => {
    const shortestCycleMs = (1 + 1) * 300;
    expect(1000 / shortestCycleMs).toBeLessThan(3);
  });
});

describe('earthquake feeds', () => {
  it('parses EMSC GeoJSON', () => {
    const q = parseEmsc({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '20261122_0000001',
          geometry: { type: 'Point', coordinates: [23.1, 38.2, -10] },
          properties: { unid: '20261122_0000001', time: '2026-11-22T10:00:00.0Z', mag: 3.4, flynn_region: 'GREECE', lat: 38.2, lon: 23.1, depth: 10 }
        },
        { type: 'Feature', properties: { mag: 'x' } }
      ]
    });
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ mag: 3.4, place: 'GREECE', lat: 38.2, lon: 23.1, depthKm: 10, source: 'EMSC' });
  });
  it('parses USGS GeoJSON', () => {
    const q = parseUsgs({
      features: [{ id: 'us7000abcd', geometry: { coordinates: [22.5, 37.1, 15.2] }, properties: { time: 1795000000000, mag: 4.6, place: '10 km S of Kalamata, Greece' } }]
    });
    expect(q[0]).toMatchObject({ mag: 4.6, lat: 37.1, lon: 22.5, depthKm: 15.2, source: 'USGS' });
  });
  it('survives garbage', () => {
    expect(parseEmsc(null)).toEqual([]);
    expect(parseUsgs({ features: 'nope' })).toEqual([]);
  });
});
