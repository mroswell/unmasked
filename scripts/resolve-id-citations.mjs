// Resolve "Id." back-reference citations by inheriting the prior citation's
// link source (document_id, bates_ids, external_url). In legal citations,
// "Id." (with or without an addition like "at 3" or editorial commentary)
// always refers to the immediately preceding source — but the extracted
// citations.json leaves these as orphans, so the popover shows "Document
// not publicly posted." This script walks citations in order, tracks the
// most recent source, and copies it forward into any sourceless Id.-form
// citation. Idempotent — running again with no upstream changes is a no-op.
//
// Run: node scripts/resolve-id-citations.mjs           (dry-run)
//      node scripts/resolve-id-citations.mjs --apply   (writes citations.json)

import { readFileSync, writeFileSync } from 'node:fs';

const PATH = './src/content/citations.json';
const APPLY = process.argv.includes('--apply');

const isIdRef = (text) => /^Id\./.test(text.trim());
const hasSource = (c) =>
  c.document_id || c.external_url || (c.bates_ids && c.bates_ids.length > 0);

const citations = JSON.parse(readFileSync(PATH, 'utf-8'));

let lastSource = null; // most recent citation that had any link source
let inherited = 0;
const examples = [];

const updated = citations.map((c) => {
  let next = c;
  if (!hasSource(c) && isIdRef(c.footnote_text) && lastSource) {
    next = {
      ...c,
      document_id: lastSource.document_id ?? null,
      bates_ids: Array.isArray(lastSource.bates_ids) ? [...lastSource.bates_ids] : [],
      external_url: lastSource.external_url ?? null,
    };
    inherited++;
    if (examples.length < 6) {
      examples.push({
        id: c.id,
        from: lastSource.id,
        text: c.footnote_text.slice(0, 80),
        gained:
          (next.document_id ? `doc=${next.document_id}` : '') ||
          (next.external_url ? `ext=${next.external_url.slice(0, 60)}` : '') ||
          (next.bates_ids?.length ? `bates=${next.bates_ids.join(',')}` : ''),
      });
    }
  }

  if (hasSource(next)) {
    lastSource = {
      id: next.id,
      document_id: next.document_id,
      bates_ids: next.bates_ids,
      external_url: next.external_url,
    };
  }
  return next;
});

console.log(`Mode: ${APPLY ? 'APPLY (writing file)' : 'DRY RUN'}`);
console.log(`Total citations: ${citations.length}`);
console.log(`Inherited from previous citation: ${inherited}`);
console.log(`Examples:`);
for (const e of examples) {
  console.log(`  ${e.id} ← ${e.from}: ${e.gained}`);
  console.log(`     "${e.text}…"`);
}

if (APPLY) {
  writeFileSync(PATH, JSON.stringify(updated, null, 2) + '\n');
  console.log(`Wrote ${PATH}`);
} else {
  console.log(`(re-run with --apply to write changes)`);
}
