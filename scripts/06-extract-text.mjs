// Extract unified text from PDFs and update catalog with coverage stats.
//
// Tool choice: pdf-parse v2 (PDFParse class). Its getText() result exposes
// `pages: { num, text }[]` directly, which gives us per-page text without
// having to drive pdfjs-dist by hand. We use pdf-parse rather than pdfjs-dist
// because it returns both a unified .text and per-page text in one call.
//
// For each PDF in public/documents/<id>.pdf:
//   - Write a unified text sidecar to public/documents/<id>.txt
//   - Compute page_count, pages_with_text, avg_chars_per_page, coverage_percent
//   - Update src/content/documents/<id>.json with those four fields

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PDFParse } from 'pdf-parse';

const DOCS_PUBLIC = './public/documents';
const DOCS_CATALOG = './src/content/documents';
const TEXT_THRESHOLD = 50; // chars per page to count as "has text"

const pdfFiles = readdirSync(DOCS_PUBLIC)
  .filter((f) => f.endsWith('.pdf'))
  .sort();

let processed = 0;
for (const filename of pdfFiles) {
  const id = filename.replace(/\.pdf$/, '');
  const pdfPath = join(DOCS_PUBLIC, filename);
  const txtPath = join(DOCS_PUBLIC, `${id}.txt`);
  const catalogPath = join(DOCS_CATALOG, `${id}.json`);

  const buffer = readFileSync(pdfPath);

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let result;
  try {
    result = await parser.getText();
  } finally {
    await parser.destroy();
  }

  const totalPages = result.total ?? result.pages.length;
  const perPageText = result.pages
    .slice()
    .sort((a, b) => a.num - b.num)
    .map((p) => (p.text ?? '').trim());

  const fullText = perPageText.join('\n\n');
  const totalChars = fullText.length;
  const pagesWithText = perPageText.filter((p) => p.length >= TEXT_THRESHOLD).length;
  const avgCharsPerPage = totalPages > 0 ? Math.round(totalChars / totalPages) : 0;
  const coveragePercent = totalPages > 0 ? Math.round((pagesWithText / totalPages) * 100) : 0;

  // Write unified text sidecar
  writeFileSync(txtPath, fullText);

  // Update catalog entry with coverage stats
  if (existsSync(catalogPath)) {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'));
    catalog.page_count = totalPages;
    catalog.pages_with_text = pagesWithText;
    catalog.avg_chars_per_page = avgCharsPerPage;
    catalog.coverage_percent = coveragePercent;
    writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  }

  processed++;
  console.log(
    `  [text] ${id}: ${totalPages}pp, ${pagesWithText} with text (${coveragePercent}%), ~${avgCharsPerPage} c/p`
  );
}

console.log(`Processed ${processed} PDFs.`);
