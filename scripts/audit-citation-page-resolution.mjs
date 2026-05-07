// Read-only audit: for every citation with bates_ids, check whether any
// of those Bates IDs resolves to a page in any bundled-doc page-index.
// Reports coverage stats and lists unresolved citations.
//
// Run: node scripts/audit-citation-page-resolution.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CITATIONS_PATH = './src/content/citations.json';
const DOCS_DIR = './public/documents';

const indexFiles = readdirSync(DOCS_DIR).filter((f) => f.endsWith('-bates-index.json'));
const indices = indexFiles.map((f) => ({
  bundleId: f.replace(/-bates-index\.json$/, ''),
  index: JSON.parse(readFileSync(join(DOCS_DIR, f), 'utf-8')),
}));
console.log(`Loaded ${indices.length} page indices.\n`);

// Mirror the extractor's normalization so OCR variants in citations.json
// ("PSI HHS-...", "PSI_HHS-...", "PSICOVID 00017031") resolve against the
// canonical keys in the page index ("PSI-HHS-...", "PSICOVID_...").
function normalizePrefix(id) {
  return id
    .replace(/^PSI[-_ ]HHS[-_ ]/, 'PSI-HHS-')
    .replace(/^PSICOVID[-_ ]?/, 'PSICOVID_');
}

// Reuse range-aware Bates parsing so cited ranges like
// "PSI-HHS-000008257237-38" resolve to either the first or any constituent page.
function expandBatesRange(id) {
  const norm = normalizePrefix(id);
  const m = norm.match(/^([A-Za-z_-]+?)(\d+)(?:-(\d+))?/);
  if (!m) return [];
  const prefix = m[1];
  const startStr = m[2];
  const start = parseInt(startStr, 10);
  let end = start;
  if (m[3]) {
    const cont = m[3];
    end = parseInt(startStr.slice(0, startStr.length - cont.length) + cont, 10);
  }
  const out = [];
  for (let n = start; n <= end; n++) {
    const padded = String(n).padStart(startStr.length, '0');
    out.push(prefix + padded);
  }
  return out;
}

function findPage(bates) {
  for (const id of expandBatesRange(bates)) {
    for (const { bundleId, index } of indices) {
      if (index[id] != null) return { bundleId, page: index[id], matchedId: id };
    }
  }
  return null;
}

const citations = JSON.parse(readFileSync(CITATIONS_PATH, 'utf-8'));
const haveBates = citations.filter((c) => c.bates_ids?.length);

let resolved = 0;
const unresolved = [];

for (const c of haveBates) {
  let hit = null;
  for (const b of c.bates_ids) {
    hit = findPage(b);
    if (hit) break;
  }
  if (hit) {
    resolved++;
  } else {
    unresolved.push({ id: c.id, bates: c.bates_ids });
  }
}

console.log(`Citations with bates_ids: ${haveBates.length}`);
console.log(`  Resolved to a bundle page: ${resolved}`);
console.log(`  Unresolved:                 ${unresolved.length}`);
console.log();

if (unresolved.length) {
  console.log(`Unresolved citations (first 25):`);
  for (const u of unresolved.slice(0, 25)) {
    console.log(`  ${u.id}: ${JSON.stringify(u.bates)}`);
  }
}
