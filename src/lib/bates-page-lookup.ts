// Resolve a citation's Bates IDs to {bundleId, page} when any of them
// land on an indexed page in one of the bundled PDFs (built once by
// scripts/build-bates-page-index.mjs into public/documents/{bundle}-bates-index.json).
// Used at build time by remark-citations.ts and Citation.astro.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DOCS_DIR = './public/documents';

let _indices: Map<string, Record<string, number>> | null = null;

function loadIndices(): Map<string, Record<string, number>> {
  if (_indices) return _indices;
  const out = new Map<string, Record<string, number>>();
  for (const f of readdirSync(DOCS_DIR)) {
    if (!f.endsWith('-bates-index.json')) continue;
    const bundleId = f.replace(/-bates-index\.json$/, '');
    const idx = JSON.parse(readFileSync(join(DOCS_DIR, f), 'utf-8'));
    if (Object.keys(idx).length > 0) {
      out.set(bundleId, idx);
    }
  }
  _indices = out;
  return out;
}

// Mirror the extractor's normalization so OCR-variant Bates IDs in
// citations.json ("PSI HHS-...", "PSICOVID 00017031") still resolve.
function normalizePrefix(id: string): string {
  return id
    .replace(/^PSI[-_ ]HHS[-_ ]/, 'PSI-HHS-')
    .replace(/^PSICOVID[-_ ]?/, 'PSICOVID_');
}

function expandBatesRange(id: string): string[] {
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
  const out: string[] = [];
  for (let n = start; n <= end; n++) {
    const padded = String(n).padStart(startStr.length, '0');
    out.push(prefix + padded);
  }
  return out;
}

export interface BatesPageHit {
  bundleId: string;
  page: number;
}

export function findBatesPage(bates_ids: readonly string[] | null | undefined): BatesPageHit | null {
  if (!bates_ids?.length) return null;
  const indices = loadIndices();
  for (const bates of bates_ids) {
    for (const id of expandBatesRange(bates)) {
      for (const [bundleId, index] of indices) {
        if (index[id] != null) {
          return { bundleId, page: index[id] };
        }
      }
    }
  }
  return null;
}
