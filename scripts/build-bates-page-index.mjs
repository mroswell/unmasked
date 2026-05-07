// Build per-bundle Bates ID → PDF page-number indices, plus per-page
// text JSON used by the document detail page's text tab.
//
// For each bundled PDF (psi-april-2026-part-N, wiseman-supporting-document-N),
// extract per-page text via pdf-parse v2's `getText({ partial: true })`,
// scan each page for Bates ID stamps, and emit:
//   public/documents/{bundle}-bates-index.json   { "PSI-HHS-...": 142, ... }
//   public/documents/{bundle}-pages.json          { "totalPages": N, "pages": [text, ...] }
//
// Local-only dev tool. Run with:
//   node scripts/build-bates-page-index.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PDFParse } from 'pdf-parse';

const COLLECTION_DIR = './src/content/documents';
const DOCS_DIR = './public/documents';

const isBundled = (id) =>
  /^psi-april-2026-part-\d+$/.test(id) ||
  /^wiseman-supporting-document-\d+$/.test(id);

const bundledIds = readdirSync(COLLECTION_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .filter(isBundled);

// Bates ID patterns. PSI report uses several variants:
//   PSI-HHS-000008257237
//   PSI-HHS-000008257237-38      (range)
//   PSI HHS-000008260150         (OCR space-instead-of-dash variant)
//   PSI_HHS-000008253450-51      (occasional underscore prefix)
//   PSICOVID_00017031
//   PSICOVID_00017032-33
const BATES_RE = /(PSI[-_ ]HHS[-_ ]\d{9,12}(?:-\d{1,4})?|PSICOVID[-_ ]?\d{8,10}(?:-\d{1,4})?)/g;

// Normalize OCR-error variants so different spellings map to the same key.
function normalizeBates(raw) {
  return raw
    .replace(/^PSI[-_ ]HHS[-_ ]/, 'PSI-HHS-')
    .replace(/^PSICOVID[-_ ]?/, 'PSICOVID_');
}

async function buildIndexForBundle(bundleId) {
  const pdfPath = join(DOCS_DIR, `${bundleId}.pdf`);
  let buf;
  try {
    buf = readFileSync(pdfPath);
  } catch (e) {
    console.warn(`  [skip] no PDF at ${pdfPath}`);
    return null;
  }
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText({ partial: true });
  await parser.destroy();

  const pageIndex = {};        // bates → first page seen
  const pageHits = {};         // page num → array of bates seen
  for (const page of result.pages) {
    const pageNum = page.num; // 1-based
    const seen = new Set();
    for (const m of page.text.matchAll(BATES_RE)) {
      const norm = normalizeBates(m[1]);
      seen.add(norm);
      // Earliest-page-wins (typical: stamp on the page itself)
      if (!(norm in pageIndex)) pageIndex[norm] = pageNum;
    }
    if (seen.size) pageHits[pageNum] = [...seen];
  }
  // Per-page text for the document detail page's text tab.
  const pages = result.pages
    .slice()
    .sort((a, b) => a.num - b.num)
    .map((p) => p.text);

  return {
    bundleId,
    totalPages: result.total,
    pagesWithStamps: Object.keys(pageHits).length,
    uniqueBates: Object.keys(pageIndex).length,
    pageIndex,
    pages,
    samplePages: Object.entries(pageHits).slice(0, 3),
  };
}

console.log(`Building Bates page indices for ${bundledIds.length} bundles...\n`);

for (const bundleId of bundledIds) {
  console.log(`▸ ${bundleId}`);
  const r = await buildIndexForBundle(bundleId);
  if (!r) continue;
  console.log(`    ${r.totalPages} pages, ${r.pagesWithStamps} with Bates stamps, ${r.uniqueBates} unique IDs`);
  for (const [pn, ids] of r.samplePages) {
    console.log(`    sample p${pn}: ${ids.slice(0, 3).join(', ')}${ids.length > 3 ? ` (+${ids.length - 3})` : ''}`);
  }
  const indexPath = join(DOCS_DIR, `${bundleId}-bates-index.json`);
  writeFileSync(indexPath, JSON.stringify(r.pageIndex, null, 2) + '\n');
  const pagesPath = join(DOCS_DIR, `${bundleId}-pages.json`);
  writeFileSync(pagesPath, JSON.stringify({ totalPages: r.totalPages, pages: r.pages }) + '\n');
  console.log(`    wrote ${indexPath}`);
  console.log(`    wrote ${pagesPath}\n`);
}

console.log('Done.');
