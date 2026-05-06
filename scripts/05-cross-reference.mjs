import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CITATIONS_PATH = './src/content/citations.json';
const DOCS_DIR = './src/content/documents';

// Build the index: from each document's bates_id, derive a Bates RANGE
// that we can match against citation Bates IDs.
//
// Document IDs (from raw manifest) take a few shapes:
//   "PSI-HHS-000001187885" — single page
//   "PSI-HHS-000004590546-47" — range 546-547
//   "PSI-HHS-000008257443-45-49-examples" — range 443-445 with descriptive suffix
//   "PSI-HHS-000004592364-65-and-PSI-HHS-000004588545-46" — TWO ranges
//   "wiseman-testimony" — non-Bates id; skip for matching
//
// We extract one or more {prefix, start, end} ranges per document. Cited Bates
// IDs are matched against any range (inclusive).

function extractRanges(docId) {
  // Find all "PSI-HHS-NNNNNNNNN" or "PSI-HHS-NNNNNNNNN-NN" substrings
  const pattern = /PSI-HHS-(\d{9})(?:-(\d{1,3}))?/g;
  const matches = [...docId.matchAll(pattern)];
  if (matches.length === 0) return null;

  const ranges = [];
  for (const m of matches) {
    const startStr = m[1];
    const endSuffix = m[2];   // e.g., "47" meaning the 9th-digit suffix
    const start = parseInt(startStr, 10);
    let end = start;
    if (endSuffix) {
      // The suffix replaces the last N digits of the start
      // e.g., "000004590546" + "47" → "000004590547"
      const endStr = startStr.slice(0, startStr.length - endSuffix.length) + endSuffix;
      end = parseInt(endStr, 10);
      if (end < start) end = start;   // sanity
    }
    ranges.push({ prefix: 'PSI-HHS-', start, end });
  }
  return ranges;
}

function citedBatesNumber(citedBates) {
  // Cited like "PSI-HHS-000008263190-91" — extract the start number
  const m = citedBates.match(/PSI-HHS-(\d{9})(?:-(\d{1,3}))?/);
  if (!m) return null;
  return { prefix: 'PSI-HHS-', value: parseInt(m[1], 10) };
}

// Build doc lookup
const docFiles = readdirSync(DOCS_DIR).filter((f) => f.endsWith('.json'));
const docIndex = [];   // [{docId, ranges}]
for (const f of docFiles) {
  const data = JSON.parse(readFileSync(join(DOCS_DIR, f), 'utf-8'));
  const ranges = extractRanges(data.bates_id);
  docIndex.push({ docId: data.bates_id, ranges });
}

function findDocForCitation(bates_ids) {
  for (const cited of bates_ids) {
    const c = citedBatesNumber(cited);
    if (!c) continue;
    for (const doc of docIndex) {
      if (!doc.ranges) continue;
      for (const r of doc.ranges) {
        if (c.prefix === r.prefix && c.value >= r.start && c.value <= r.end) {
          return doc.docId;
        }
      }
    }
  }
  return null;
}

// Apply
const citations = JSON.parse(readFileSync(CITATIONS_PATH, 'utf-8'));
let linked = 0;
let unlinked = 0;
for (const cit of citations) {
  if (cit.bates_ids && cit.bates_ids.length > 0) {
    const docId = findDocForCitation(cit.bates_ids);
    if (docId) {
      cit.document_id = docId;
      linked++;
    } else {
      cit.document_id = null;   // explicit
      unlinked++;
    }
  } else {
    cit.document_id = null;
    unlinked++;
  }
}

writeFileSync(CITATIONS_PATH, JSON.stringify(citations, null, 2) + '\n');
console.log(`Citations linked to documents: ${linked}`);
console.log(`Citations not linked: ${unlinked}`);
console.log(`Total citations: ${citations.length}`);
