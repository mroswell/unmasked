// Search the bundled OCR text of large PDF compilations to see if any
// citation Bates IDs we currently mark as "Document not publicly posted"
// actually live inside one of the bundled documents (e.g., the
// psi-april-2026-part-N PDFs are big concatenations of many records).
//
// Read-only audit — does not modify citations.json. Run:
//   node scripts/find-citations-in-bundled-ocr.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CITATIONS_PATH = './src/content/citations.json';
const DOCS_DIR = './public/documents';
const COLLECTION_DIR = './src/content/documents';

// "Bundled" candidates = documents in the collection that look like
// multi-record compilations rather than single Bates-range records.
const isBundled = (id) =>
  /^psi-april-2026-part-\d+$/.test(id) ||
  /^wiseman-supporting-document-\d+$/.test(id);

const collectionIds = readdirSync(COLLECTION_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''));

const bundledIds = collectionIds.filter(isBundled);
const bundledOcr = new Map();
for (const id of bundledIds) {
  const txtPath = join(DOCS_DIR, `${id}.txt`);
  try {
    const stat = statSync(txtPath);
    if (stat.isFile()) {
      bundledOcr.set(id, readFileSync(txtPath, 'utf-8'));
    }
  } catch {
    // No OCR text — skip
  }
}

console.log(`Loaded OCR text for ${bundledOcr.size} bundled docs:`);
for (const [id, text] of bundledOcr) {
  console.log(`  ${id} (${(text.length / 1024).toFixed(0)} KB)`);
}
console.log();

const citations = JSON.parse(readFileSync(CITATIONS_PATH, 'utf-8'));

// Citations of interest = those without a hosted document_id.
// Subset 1: bates_ids known but no document_id (could find a home in a bundle)
// Subset 2: external_url-only (we'd still link out, but maybe a bundle has the underlying record too)
const nullDocCitations = citations.filter(
  (c) => !c.document_id && c.bates_ids?.length
);

console.log(`Searching ${nullDocCitations.length} citations (no current doc_id, has bates_ids) across ${bundledOcr.size} bundled docs.`);
console.log();

// For each citation, check each bundle for any of its bates_ids appearing
// as a substring. Since OCR can introduce small typos, search both the
// full Bates ID and the leading 9-digit page number.
const found = [];
const notFound = [];

for (const cit of nullDocCitations) {
  const matchedBundles = new Set();
  for (const bates of cit.bates_ids) {
    // Numeric core: strip the alpha prefix to a long page number
    const numericMatch = bates.match(/(\d{6,})/);
    const numeric = numericMatch ? numericMatch[1] : null;
    for (const [bundleId, text] of bundledOcr) {
      if (text.includes(bates)) {
        matchedBundles.add(bundleId);
      } else if (numeric && text.includes(numeric)) {
        matchedBundles.add(bundleId);
      }
    }
  }
  if (matchedBundles.size > 0) {
    found.push({ id: cit.id, bates: cit.bates_ids, bundles: [...matchedBundles] });
  } else {
    notFound.push({ id: cit.id, bates: cit.bates_ids });
  }
}

console.log(`Match summary:`);
console.log(`  Found in at least one bundle:  ${found.length}`);
console.log(`  Not found in any bundle:        ${notFound.length}`);
console.log();

if (found.length) {
  console.log(`Citations matched to bundle(s):`);
  for (const f of found) {
    console.log(`  ${f.id} → ${f.bundles.join(', ')}`);
    console.log(`     bates: ${JSON.stringify(f.bates)}`);
  }
}

console.log();
if (notFound.length) {
  console.log(`Citations NOT found anywhere (first 20):`);
  for (const n of notFound.slice(0, 20)) {
    console.log(`  ${n.id}: ${JSON.stringify(n.bates)}`);
  }
}
