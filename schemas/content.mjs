// Schemas for everything under content/. The build script and the tests both
// use them, so a pull request with a missing source or a broken file fails CI.
import { z } from 'zod';

export const LOCALES = ['el', 'en'];
export const BASE_LOCALE = 'en';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use YYYY-MM-DD');
const nonEmpty = z.string().trim().min(1);

export const Source = z.object({
  name: nonEmpty,
  url: z.url({ protocol: /^https$/ })
});

// "draft": written but not yet checked line by line against the sources.
// "reviewed": a maintainer checked it; needs who and when.
const Review = z.discriminatedUnion('status', [
  z.object({ status: z.literal('draft') }),
  z.object({ status: z.literal('reviewed'), last_reviewed: isoDate, reviewed_by: nonEmpty })
]);

const localized = (shape) =>
  z
    .record(z.string(), z.object(shape))
    .refine((rec) => BASE_LOCALE in rec, { message: `the "${BASE_LOCALE}" locale is required` })
    .refine((rec) => Object.keys(rec).every((k) => LOCALES.includes(k)), {
      message: `unknown locale; add it to LOCALES in schemas/content.mjs first`
    });

const steps = z.array(nonEmpty).min(1).max(8);

export const Guide = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    icon: z.enum(['earthquake', 'wildfire', 'flood', 'heatwave']),
    order: z.number().int(),
    sources: z.array(Source).min(1, 'every guide needs at least one official source'),
    locales: localized({ title: nonEmpty, now: nonEmpty, before: steps, during: steps, after: steps })
  })
  .and(Review);

export const EmergencyNumber = z.object({
  number: z.string().regex(/^[0-9+]{2,15}$/),
  locales: localized({ label: nonEmpty })
});

export const OnlineLink = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  region: z.string().regex(/^[a-z0-9-]+$/).optional(),
  url: z.url({ protocol: /^https$/ }),
  locales: localized({ label: nonEmpty })
});

export const Country = z
  .object({
    code: z.string().regex(/^[a-z]{2}$/),
    emergency: z.string().regex(/^[0-9]{2,4}$/),
    numbers: z.array(EmergencyNumber),
    links: z.array(OnlineLink).default([]),
    sources: z.array(Source).min(1),
    locales: localized({ name: nonEmpty, authority: nonEmpty })
  })
  .and(Review);

// Step-by-step procedures used by tools (trapped, CPR).
export const Procedure = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    sources: z.array(Source).min(1, 'every procedure needs at least one official source'),
    locales: localized({ title: nonEmpty, intro: nonEmpty, steps: steps })
  })
  .and(Review);

// First aid topics (content/firstaid.yaml), loaded lazily by the app.
export const FirstAid = z
  .object({
    sources: z.array(Source).min(1, 'first aid needs at least one official source'),
    topics: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          urgent: z.boolean(),
          locales: localized({ title: nonEmpty, signs: nonEmpty, steps: z.array(nonEmpty).min(1).max(8) })
        })
      )
      .min(1)
  })
  .and(Review);

// Phone setup, evacuation checklist and phrase card (content/extras.yaml), loaded lazily.
const listOf = (shape) => localized(shape);
export const Extras = z.object({
  setup: z
    .object({
      sources: z.array(Source).min(1),
      platforms: z.array(z.object({ id: z.string(), locales: listOf({ title: nonEmpty, steps: z.array(nonEmpty).min(1).max(10) }) }))
    })
    .and(Review),
  evacuation: z
    .object({
      sources: z.array(Source).min(1),
      groups: z.array(
        z.object({ id: z.string(), minutes: z.number().int().positive(), locales: listOf({ title: nonEmpty, items: z.array(nonEmpty).min(1) }) })
      )
    })
    .and(Review),
  phrases: z
    .object({
      languages: z.array(z.string().regex(/^[a-z]{2}$/)).min(1),
      items: z.array(z.record(z.string(), z.string().min(1))).min(1)
    })
    .refine((p) => p.items.every((it) => 'el' in it && 'id' in it && p.languages.every((l) => l in it)), {
      message: 'every phrase needs id, el and every listed language'
    })
});

// Downloadable offline map regions. bbox = [west, south, east, north].
export const Region = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  bbox: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90), z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .refine(([w, s, e, n]) => w < e && s < n, 'bbox must be [west, south, east, north]'),
  maxzoom: z.number().int().min(10).max(15),
  locales: localized({ name: nonEmpty })
});

export const KitItem = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  locales: localized({ label: nonEmpty })
});

export const Kit = z
  .object({
    sources: z.array(Source).min(1),
    groups: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          locales: localized({ title: nonEmpty }),
          items: z.array(KitItem).min(1)
        })
      )
      .min(1)
  })
  .and(Review);
