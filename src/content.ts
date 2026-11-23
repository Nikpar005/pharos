// Typed access to src/generated/content.json (built from content/ by
// scripts/build-content.mjs). Falls back to English when a translation is missing.
import raw from './generated/content.json';

type Loc<T> = Record<string, T>;
interface Source {
  name: string;
  url: string;
}
type Review = { status: 'draft' } | { status: 'reviewed'; last_reviewed: string; reviewed_by: string };

export type GuideIcon = 'earthquake' | 'wildfire' | 'flood' | 'heatwave';

export type Guide = Review & {
  id: string;
  icon: GuideIcon;
  order: number;
  sources: Source[];
  locales: Loc<{ title: string; now: string; before: string[]; during: string[]; after: string[] }>;
};

export interface OnlineLink {
  id: string;
  region?: string;
  url: string;
  locales: Loc<{ label: string }>;
}

export type Country = Review & {
  code: string;
  emergency: string;
  links: OnlineLink[];
  numbers: { number: string; locales: Loc<{ label: string }> }[];
  sources: Source[];
  locales: Loc<{ name: string; authority: string }>;
};

export type Kit = Review & {
  sources: Source[];
  groups: { id: string; locales: Loc<{ title: string }>; items: { id: string; locales: Loc<{ label: string }> }[] }[];
};

export type Procedure = Review & {
  id: string;
  sources: Source[];
  locales: Loc<{ title: string; intro: string; steps: string[] }>;
};

export interface Region {
  id: string;
  bbox: [number, number, number, number];
  maxzoom: number;
  locales: Loc<{ name: string }>;
}

const content = raw as unknown as {
  guides: Guide[];
  countries: Country[];
  kit: Kit;
  procedures: Procedure[];
  regions: Region[];
};

export const guides = content.guides;
export const countries = content.countries;
export const kit = content.kit;
export const regions = content.regions;

export function getProcedure(id: string): Procedure {
  const p = content.procedures.find((x) => x.id === id);
  if (!p) throw new Error(`missing content/procedures/${id}.yaml`);
  return p;
}

export function pick<T>(locales: Loc<T>, lang: string): T {
  return (locales[lang] ?? locales.en)!;
}

export function getCountry(code: string): Country {
  return countries.find((c) => c.code === code) ?? countries[0]!;
}

export function getGuide(id: string): Guide | undefined {
  return guides.find((g) => g.id === id);
}

export const kitItemIds = kit.groups.flatMap((g) => g.items.map((i) => i.id));
