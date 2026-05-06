import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import XLSX from 'xlsx';

const MANIFEST = JSON.parse(readFileSync('./raw/manifest.json', 'utf-8'));
const OUT_DIR = './public/documents';
mkdirSync(OUT_DIR, { recursive: true });

let processed = 0;
for (const entry of MANIFEST) {
  if (entry.ext === 'pdf') continue;
  if (entry.ext !== 'xls' && entry.ext !== 'xlsx') {
    console.warn(`Skipping ${entry.id}: unknown ext ${entry.ext}`);
    continue;
  }

  const inPath = entry.local_path;
  const outXlsx = join(OUT_DIR, `${entry.id}.xlsx`);
  const outJson = join(OUT_DIR, `${entry.id}.json`);
  const outTxt = join(OUT_DIR, `${entry.id}.txt`);

  // Read workbook
  const workbook = XLSX.readFile(inPath, { cellDates: true });

  // Extract sheets to a structured shape
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    // First row is typically headers; expose explicitly
    const headers = rows.length > 0 ? rows[0].map((c) => String(c ?? '')) : [];
    const data = rows.slice(1);
    return { name, headers, rows: data };
  });

  // Write JSON
  writeFileSync(outJson, JSON.stringify({ sheets }, null, 2));

  // Write flattened text sidecar for Pagefind
  const textParts = [];
  for (const s of sheets) {
    textParts.push(`Sheet: ${s.name}`);
    if (s.headers.length) textParts.push(s.headers.join(' | '));
    for (const row of s.rows) {
      textParts.push(row.map((c) => String(c ?? '')).join(' | '));
    }
    textParts.push('');
  }
  writeFileSync(outTxt, textParts.join('\n'));

  // Copy original .xlsx (or .xls) to public for download
  copyFileSync(inPath, outXlsx);

  processed++;
  console.log(`  [xlsx] ${entry.id} (${sheets.length} sheet${sheets.length > 1 ? 's' : ''})`);
}

console.log(`Processed ${processed} spreadsheets.`);
