import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MANIFEST = JSON.parse(readFileSync('./raw/manifest.json', 'utf-8'));
const CATALOG_DIR = './src/content/documents';

// Map manifest kind to doc_type
function kindToDocType(kind, ext) {
  if (kind === 'statement') return 'statement';
  if (kind === 'testimony') return 'testimony';
  if (kind === 'bundle') return 'bundle';
  if (kind === 'report') return 'report';
  if (kind === 'attachment' && (ext === 'xls' || ext === 'xlsx')) return 'spreadsheet';
  if (kind === 'attachment') return 'other';
  return 'other';
}

for (const entry of MANIFEST) {
  const id = entry.id;
  const ext = entry.ext;
  const isPdf = ext === 'pdf';
  const format = isPdf ? 'pdf' : 'spreadsheet';
  const doc_type = kindToDocType(entry.kind, ext);

  const record = {
    bates_id: id,
    title: entry.title,
    doc_type,
    format,
    source_url: entry.source_url,
    split_from: null,
  };

  if (isPdf) {
    record.pdf_path = `/documents/${id}.pdf`;
    record.ocr_text_path = `/documents/${id}.txt`;
  } else {
    record.xlsx_path = `/documents/${id}.xlsx`;
    record.table_data_path = `/documents/${id}.json`;
    record.ocr_text_path = `/documents/${id}.txt`;
  }

  writeFileSync(join(CATALOG_DIR, `${id}.json`), JSON.stringify(record, null, 2) + '\n');
}

console.log(`Wrote ${MANIFEST.length} catalog entries.`);
