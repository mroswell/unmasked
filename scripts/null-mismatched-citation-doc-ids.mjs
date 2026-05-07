// One-shot content fix: null `document_id` on any citation whose
// `bates_ids` don't actually fall within the linked document's Bates
// range. The mapping in citations.json was assigning citations to a
// "neighbor" document whenever the cited pages weren't in our document
// collection — producing misleading "Read document →" links.
//
// Run: node scripts/null-mismatched-citation-doc-ids.mjs [--apply]
// Without --apply, prints what it WOULD change. With --apply, writes
// the file.

import { readFileSync, writeFileSync } from 'node:fs';

const CITATIONS_PATH = './src/content/citations.json';
const APPLY = process.argv.includes('--apply');

// Parse a Bates-style ID into one or more numeric ranges of the form
// {prefix, start, end}. Examples:
//   "PSI-HHS-000004783470-73"            → [{prefix:'PSI-HHS-', start:4783470, end:4783473}]
//   "PSI-HHS-000008257443-45-49-examples" → [{prefix:'PSI-HHS-', start:8257443, end:8257445}]
//   "PSI-HHS-000004592364-65-and-000004588545-46" →
//      [{prefix:'PSI-HHS-', 4592364..4592365}, {prefix:'PSI-HHS-', 4588545..4588546}]
//   "PSICOVID_00017032-33"               → [{prefix:'PSICOVID_', start:17032, end:17033}]
function parseBatesRanges(id) {
  const ranges = [];
  for (const part of id.split(/-and-|_and_/)) {
    // Capture: alpha/separator prefix, then the leading numeric Bates page,
    // then an optional `-NN` continuation suffix that gives the end-page.
    const m = part.match(/^([A-Za-z_-]+?)(\d+)(?:-(\d+))?/);
    if (!m) continue;
    const prefix = m[1];
    const startStr = m[2];
    const start = parseInt(startStr, 10);
    let end = start;
    if (m[3]) {
      const cont = m[3];
      // The continuation replaces the last cont.length digits of start.
      // E.g. start=000004783470, cont=73 → 000004783473.
      const replaced = startStr.slice(0, startStr.length - cont.length) + cont;
      end = parseInt(replaced, 10);
    }
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      ranges.push({ prefix, start, end });
    }
  }
  return ranges;
}

function rangesOverlap(a, b) {
  return a.prefix === b.prefix && a.start <= b.end && b.start <= a.end;
}

function batesInDoc(batesId, docId) {
  const aRanges = parseBatesRanges(batesId);
  const bRanges = parseBatesRanges(docId);
  for (const a of aRanges) {
    for (const b of bRanges) {
      if (rangesOverlap(a, b)) return true;
    }
  }
  return false;
}

const citations = JSON.parse(readFileSync(CITATIONS_PATH, 'utf-8'));

let cleared = 0;
const clearedExamples = [];
const updated = citations.map((cit) => {
  if (!cit.document_id || !cit.bates_ids?.length) return cit;
  const anyMatch = cit.bates_ids.some((b) => batesInDoc(b, cit.document_id));
  if (anyMatch) return cit;
  cleared++;
  if (clearedExamples.length < 8) {
    clearedExamples.push({ id: cit.id, bates: cit.bates_ids, was: cit.document_id });
  }
  return { ...cit, document_id: null };
});

console.log(`Mode: ${APPLY ? 'APPLY (writing file)' : 'DRY RUN (no file write)'}`);
console.log(`Total citations: ${citations.length}`);
console.log(`document_id cleared: ${cleared}`);
console.log(`document_id kept (genuine match): ${citations.filter((c) => c.document_id && c.bates_ids?.length).length - cleared}`);
console.log(`Examples of cleared mappings:`);
for (const e of clearedExamples) console.log(`  ${e.id}: bates=${JSON.stringify(e.bates)} was→${e.was}`);

if (APPLY) {
  writeFileSync(CITATIONS_PATH, JSON.stringify(updated, null, 2) + '\n');
  console.log(`Wrote ${CITATIONS_PATH}`);
} else {
  console.log(`(re-run with --apply to write changes)`);
}
