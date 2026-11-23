import { describe, expect, it } from 'vitest';
import { bearing, compassPoint, distance, formatCoords, formatDistance, geoUri, mapLink } from '../src/lib/geo';

const syntagma = { lat: 37.97561, lon: 23.73478 };
const acropolis = { lat: 37.97153, lon: 23.72575 };
const thessaloniki = { lat: 40.64007, lon: 22.94442 };

describe('distance', () => {
  it('is zero for the same point', () => {
    expect(distance(syntagma, syntagma)).toBe(0);
  });
  it('Syntagma to the Acropolis is about 900 m', () => {
    expect(distance(syntagma, acropolis)).toBeGreaterThan(850);
    expect(distance(syntagma, acropolis)).toBeLessThan(950);
  });
  it('Athens to Thessaloniki is about 300 km', () => {
    const km = distance(syntagma, thessaloniki) / 1000;
    expect(km).toBeGreaterThan(295);
    expect(km).toBeLessThan(310);
  });
});

describe('bearing and compassPoint', () => {
  it('due north / east / south / west', () => {
    const o = { lat: 0, lon: 0 };
    expect(bearing(o, { lat: 1, lon: 0 })).toBeCloseTo(0, 5);
    expect(bearing(o, { lat: 0, lon: 1 })).toBeCloseTo(90, 5);
    expect(bearing(o, { lat: -1, lon: 0 })).toBeCloseTo(180, 5);
    expect(bearing(o, { lat: 0, lon: -1 })).toBeCloseTo(270, 5);
  });
  it('Athens to Thessaloniki is north-north-west, so "north" on an 8-point compass', () => {
    const b = bearing(syntagma, thessaloniki);
    expect(b).toBeGreaterThan(337.5);
    expect(b).toBeLessThan(350);
    expect(compassPoint(b)).toBe(0);
  });
  it('compassPoint wraps around', () => {
    expect(compassPoint(359)).toBe(0);
    expect(compassPoint(-10)).toBe(0);
    expect(compassPoint(44)).toBe(1);
    expect(compassPoint(180)).toBe(4);
  });
});

describe('formatting', () => {
  it('formats coordinates to 5 decimals (~1 m)', () => {
    expect(formatCoords({ lat: 37.975612345, lon: 23.7347 })).toBe('37.97561, 23.73470');
  });
  it('formats distances', () => {
    expect(formatDistance(123, 'en')).toBe('120 m');
    expect(formatDistance(1530, 'en')).toBe('1.5 km');
    expect(formatDistance(1530, 'el')).toBe('1,5 km');
    expect(formatDistance(25400, 'en')).toBe('25 km');
  });
  it('builds map links', () => {
    expect(mapLink(syntagma)).toBe('https://www.openstreetmap.org/?mlat=37.97561&mlon=23.73478#map=17/37.97561/23.73478');
    expect(geoUri({ lat: 1, lon: 2 }, 'Πλατεία')).toBe(`geo:1.000000,2.000000?q=1.000000,2.000000(${encodeURIComponent('Πλατεία')})`);
  });
});
