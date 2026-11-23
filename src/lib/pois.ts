// Places that matter in an emergency, per map region, from OpenStreetMap.
// Built by .github/workflows/build-maps.yml (scripts/pois.mjs) and downloaded
// together with the region's map, so "Nearby" works with no internet.
import { distance, type Coords } from './geo';

export type Category = 'assembly' | 'hospital' | 'pharmacy' | 'police' | 'fire';
export const CATEGORIES: Category[] = ['assembly', 'hospital', 'pharmacy', 'police', 'fire'];

/** [category, lat, lon, name, phone] — arrays keep the file small. */
export type PoiRow = [Category, number, number, string, string];

export interface PoiFile {
  v: 1;
  generated: string;
  items: PoiRow[];
}

export interface Place {
  category: Category;
  coords: Coords;
  name: string;
  phone: string;
  meters: number;
}

export function isPoiFile(x: unknown): x is PoiFile {
  const f = x as PoiFile;
  return !!f && f.v === 1 && Array.isArray(f.items);
}

/** The `limit` closest places of each category to `here`. */
export function nearest(files: PoiFile[], here: Coords, limit = 3): Record<Category, Place[]> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c, [] as Place[]])) as Record<Category, Place[]>;
  for (const f of files) {
    for (const [category, lat, lon, name, phone] of f.items) {
      if (!(category in out)) continue;
      const meters = distance(here, { lat, lon });
      const list = out[category];
      // Keep only the best `limit` without sorting thousands of entries.
      if (list.length < limit || meters < list[list.length - 1]!.meters) {
        list.push({ category, coords: { lat, lon }, name, phone, meters });
        list.sort((a, b) => a.meters - b.meters);
        if (list.length > limit) list.pop();
      }
    }
  }
  return out;
}
