#!/usr/bin/env node
// Prints content/regions.yaml as "id<TAB>w,s,e,n<TAB>maxzoom" lines for the map build workflow.
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
for (const r of parse(readFileSync(new URL('../content/regions.yaml', import.meta.url), 'utf8')).regions) {
  console.log(`${r.id}\t${r.bbox.join(',')}\t${r.maxzoom}`);
}
