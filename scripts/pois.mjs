#!/usr/bin/env node
// Turns an Overpass API JSON answer into the compact file the app downloads
// (maps/<region>.pois.json). Data © OpenStreetMap contributors, ODbL.
//   node scripts/pois.mjs overpass.json > attica.pois.json
import { readFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const categoryOf = (t) => {
  if (t.emergency === 'assembly_point') return 'assembly';
  switch (t.amenity) {
    case 'hospital':
    case 'clinic':
      return 'hospital';
    case 'pharmacy':
      return 'pharmacy';
    case 'police':
      return 'police';
    case 'fire_station':
      return 'fire';
    default:
      return null;
  }
};
const round = (n) => Math.round(n * 1e5) / 1e5;
const items = [];
const seen = new Set();
for (const el of raw.elements ?? []) {
  const t = el.tags ?? {};
  const c = categoryOf(t);
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!c || lat == null || lon == null) continue;
  const key = `${c}:${round(lat)}:${round(lon)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const name = (t['name:el'] ?? t.name ?? '').slice(0, 80);
  const phone = (t.phone ?? t['contact:phone'] ?? '').split(';')[0].trim().slice(0, 30);
  items.push([c, round(lat), round(lon), name, phone]);
}
process.stdout.write(JSON.stringify({ v: 1, generated: new Date().toISOString().slice(0, 10), items }));
console.error(`pois: ${items.length} places`);
