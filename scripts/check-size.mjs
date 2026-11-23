#!/usr/bin/env node
// Performance budget. Fails CI if the code the app needs to start grows past
// the budget, so the app keeps loading fast on old phones and slow networks.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = { startJs: 45, css: 8 }; // gzipped

const dist = join(process.cwd(), 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const gz = (file) => gzipSync(readFileSync(join(dist, file))).length / 1024;

// Start-up JS = scripts referenced by index.html (+ their static imports via modulepreload).
const startFiles = [...html.matchAll(/(?:src|href)="[^"]*?(assets\/[^"]+\.js)"/g)].map((m) => m[1]);
// Start-up CSS = stylesheets linked from index.html (lazy screens' CSS is excluded).
const cssFiles = [...html.matchAll(/href="[^"]*?(assets\/[^"]+\.css)"/g)].map((m) => m[1]);

const startJs = startFiles.reduce((s, f) => s + gz(f), 0);
const css = cssFiles.reduce((s, f) => s + gz(f), 0);

const rows = [
  ['start-up JS', startJs, BUDGET_KB.startJs],
  ['CSS', css, BUDGET_KB.css]
];
let failed = false;
for (const [name, size, budget] of rows) {
  const ok = size <= budget;
  failed ||= !ok;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(12)} ${size.toFixed(1).padStart(6)} KB gz  (budget ${budget} KB)`);
}
// Report (no budget): everything a first visit downloads, and the lazy chunks.
const assets = readdirSync(join(dist, 'assets'));
const lazy = assets.filter((f) => !startFiles.includes(`assets/${f}`) && !cssFiles.includes(`assets/${f}`));
console.log('\nlazy chunks (loaded only when needed):');
for (const f of lazy) console.log(`     ${f.padEnd(44)} ${gz(`assets/${f}`).toFixed(1).padStart(6)} KB gz`);
try {
  const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
  const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
  const bytes = urls.reduce((s, u) => {
    try {
      return s + statSync(join(dist, u)).size;
    } catch {
      return s;
    }
  }, 0);
  console.log(`\nfirst visit (everything precached for offline): ${(bytes / 1024).toFixed(0)} KB raw, ${urls.length} files`);
} catch {
  /* no service worker in this build */
}

if (failed) {
  console.error('\nOver budget. Lazy-load the new code (see src/screens/Share.tsx) or raise the budget in a reviewed PR.');
  process.exit(1);
}
