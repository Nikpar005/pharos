import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
// @ts-expect-error plain JS module shared with the build script
import { Guide, Country, Kit, Procedure, Region, FirstAid } from '../schemas/content.mjs';
import el from '../src/i18n/el.json';
import en from '../src/i18n/en.json';

const dir = fileURLToPath(new URL('../content', import.meta.url));
const yaml = (p: string) => parse(readFileSync(join(dir, p), 'utf8'));

describe('content files', () => {
  for (const f of readdirSync(join(dir, 'guides'))) {
    it(`guides/${f} is valid`, () => {
      const r = Guide.safeParse(yaml(`guides/${f}`));
      expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
    });
  }
  for (const f of readdirSync(join(dir, 'countries'))) {
    it(`countries/${f} is valid`, () => {
      const r = Country.safeParse(yaml(`countries/${f}`));
      expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
    });
  }
  for (const f of readdirSync(join(dir, 'procedures'))) {
    it(`procedures/${f} is valid`, () => {
      const r = Procedure.safeParse(yaml(`procedures/${f}`));
      expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
    });
  }
  it('regions.yaml is valid', () => {
    for (const region of yaml('regions.yaml').regions) {
      const r = Region.safeParse(region);
      expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
    }
  });
  it('a region with a flipped bbox is rejected', () => {
    expect(Region.safeParse({ id: 'x', bbox: [24, 38, 23, 37], maxzoom: 14, locales: { en: { name: 'X' } } }).success).toBe(false);
  });
  it('firstaid.yaml is valid, cites ΕΚΑΒ, and every topic has Greek and English', () => {
    const data = yaml('firstaid.yaml');
    const r = FirstAid.safeParse(data);
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
    expect(data.sources.some((s: { name: string }) => s.name.includes('ΕΚΑΒ'))).toBe(true);
    for (const t of data.topics) expect(Object.keys(t.locales).sort()).toEqual(['el', 'en']);
  });
  it('kit.yaml is valid', () => {
    const r = Kit.safeParse(yaml('kit.yaml'));
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });
});

describe('content rules', () => {
  const base = yaml('guides/earthquake.yaml');

  it('a guide without sources is rejected', () => {
    expect(Guide.safeParse({ ...base, sources: [] }).success).toBe(false);
  });
  it('sources must be https', () => {
    expect(Guide.safeParse({ ...base, sources: [{ name: 'x', url: 'http://example.org' }] }).success).toBe(false);
  });
  it('"reviewed" needs a date and a reviewer', () => {
    expect(Guide.safeParse({ ...base, status: 'reviewed' }).success).toBe(false);
    expect(
      Guide.safeParse({ ...base, status: 'reviewed', last_reviewed: '2026-11-22', reviewed_by: 'Nikpar005' }).success
    ).toBe(true);
  });
  it('the English base locale is required', () => {
    const { en: _en, ...others } = base.locales;
    expect(Guide.safeParse({ ...base, locales: others }).success).toBe(false);
  });
  it('unknown locales are rejected', () => {
    expect(Guide.safeParse({ ...base, locales: { ...base.locales, xx: base.locales.en } }).success).toBe(false);
  });
});

describe('translations', () => {
  it('el.json and en.json have exactly the same keys', () => {
    expect(Object.keys(el).sort()).toEqual(Object.keys(en).sort());
  });
  it('placeholders match between languages', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect(ph(el[k]), k).toEqual(ph(en[k]));
    }
  });
});
