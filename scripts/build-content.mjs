#!/usr/bin/env node
// Reads content/**/*.yaml, validates it, and writes src/generated/content.json.
//   node scripts/build-content.mjs          build
//   node scripts/build-content.mjs --check  validate only (CI), also lists missing translations
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { Guide, Country, Kit, Procedure, Region, FirstAid, LOCALES } from '../schemas/content.mjs';
import { z } from 'zod';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'content');
const checkOnly = process.argv.includes('--check');

const errors = [];
const warnings = [];

function load(file, schema) {
  const rel = relative(root, file);
  let data;
  try {
    data = parse(readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${rel}: invalid YAML: ${e.message}`);
    return null;
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${rel}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    return null;
  }
  for (const loc of LOCALES) {
    if (result.data.locales && !(loc in result.data.locales)) warnings.push(`${rel}: no "${loc}" translation yet`);
  }
  if (result.data.status === 'draft') warnings.push(`${rel}: still a draft (not reviewed against its sources)`);
  return result.data;
}

function loadDir(dir, schema) {
  return readdirSync(join(contentDir, dir))
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .map((f) => load(join(contentDir, dir, f), schema))
    .filter(Boolean);
}

const guides = loadDir('guides', Guide).sort((a, b) => a.order - b.order);
const countries = loadDir('countries', Country);
const kit = load(join(contentDir, 'kit.yaml'), Kit);
const procedures = loadDir('procedures', Procedure);
const firstAid = load(join(contentDir, 'firstaid.yaml'), FirstAid);
const regions = load(join(contentDir, 'regions.yaml'), z.object({ regions: z.array(Region).min(1) }))?.regions ?? [];

const topicIds = new Set();
for (const t of firstAid?.topics ?? []) {
  if (topicIds.has(t.id)) errors.push(`content/firstaid.yaml: duplicate topic id "${t.id}"`);
  topicIds.add(t.id);
  for (const loc of LOCALES) if (!(loc in t.locales)) warnings.push(`content/firstaid.yaml: topic "${t.id}" has no "${loc}" translation yet`);
}

const seen = new Set();
for (const g of guides) {
  if (seen.has(g.id)) errors.push(`content/guides: duplicate guide id "${g.id}"`);
  seen.add(g.id);
}
const itemIds = new Set();
for (const item of kit?.groups.flatMap((g) => g.items) ?? []) {
  if (itemIds.has(item.id)) errors.push(`content/kit.yaml: duplicate item id "${item.id}"`);
  itemIds.add(item.id);
}

for (const w of warnings) console.warn(`warn  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error ${e}`);
  console.error(`\n${errors.length} content error(s). See CONTRIBUTING.md → "Content rules".`);
  process.exit(1);
}

const out = { guides, countries, kit, procedures, regions };
if (!checkOnly) {
  const target = join(root, 'src', 'generated', 'content.json');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(out));
  // First aid is a separate file so the app loads it only when that screen opens.
  writeFileSync(join(root, 'src', 'generated', 'firstaid.json'), JSON.stringify(firstAid));
}
console.log(
  `content ok: ${guides.length} guides, ${countries.length} countries, ${itemIds.size} kit items, ` +
    `${procedures.length} procedures, ${topicIds.size} first-aid topics, ${regions.length} map regions` +
    (checkOnly ? '' : ' → src/generated/content.json')
);
