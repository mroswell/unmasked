# Document detail page redesign: tabs, unified text, coverage report, and Format(Type) filter

## Context

The current per-document page layout (`src/pages/documents/[bates_id].astro`) is a 2-column split: PDF embed on the left, metadata + collapsible OCR text on the right. The PDF column ends up too narrow to comfortably read scanned exhibits. We also have an asymmetry in the text sidecars: scanned PDFs have OCR'd text in `<id>.txt`, but native-text PDFs (testimonies, the chairman's statement) were processed with `ocrmypdf --skip-text` and have empty/minimal sidecars even though the underlying PDF has perfectly extractable native text.

Five coupled changes:

1. **Tab interface for PDFs** — replace the 2-column split with two tabs: "Document" (the PDF embed at full width) and "Document text" (a unified text view). Spreadsheets keep their current single-pane layout (no OCR'd content in any spreadsheet sidecar — confirmed; their `.txt` files are pipe-delimited dumps of parsed cell data).
2. **Unify native text + OCR'd text** — re-extract `.txt` sidecars from the post-`ocrmypdf` output PDFs so the sidecar contains everything (whatever's in the merged PDF — both native and OCR'd text). Currently testimonies have empty sidecars; this fixes that.
3. **Coverage report** — for PDFs, compute and display two metrics on the Document text tab: percentage of pages with extractable text, and average characters per page.
4. **Combined "Format (Type)" column** — replace the separate Type and Format display in the metadata pane and on the index table with a single "Format (Type)" value (e.g., "PDF (testimony)", "PDF (bundle)"). For spreadsheets, display just "Spreadsheet" (no parenthetical type). Place it before the Download field in the metadata.
5. **Filter chips on the index** — single filter bar above the document table, single-select chips for the distinct Format(Type) values: All / PDF (testimony) / PDF (statement) / PDF (bundle) / Spreadsheet. Same chip pattern as `/timeline/` and `/glossary/`.

Tab selection is URL-shareable via hash (`#text` and `#doc`); default to `#doc`.

## Plan

### 1. Add `pdf-parse` dep and a text-extraction script

Install:
```bash
npm install -D pdf-parse
```

Create `scripts/06-extract-text.mjs` that walks `public/documents/*.pdf` and, for each:
- Reads the file via `pdf-parse` (handles both native-text and OCR'd-layer PDFs uniformly)
- Extracts the full text and per-page text
- Writes the unified text to `public/documents/<id>.txt` (overwriting the existing OCR-only sidecar)
- Computes `page_count`, `pages_with_text`, `avg_chars_per_page` and `coverage_percent` (= `pages_with_text / page_count`, rounded)
- Updates the document's catalog JSON (`src/content/documents/<id>.json`) to add these fields

`pdf-parse` extracts per-page text via its `pagerender` callback, which gives us what we need for both metrics.

Threshold for "page has text" is **50 characters** (a reasonable floor below which the page is effectively blank — captures empty scanned pages, separator pages, redaction-heavy pages).

The script is idempotent: re-running it just refreshes the values.

### 2. Schema additions

Update the `documents` collection schema in `src/content.config.ts`:

```ts
schema: z.object({
  // ...existing fields...
  page_count: z.number().int().nonnegative().optional(),       // already optional, now actually populated
  pages_with_text: z.number().int().nonnegative().optional(),  // NEW
  avg_chars_per_page: z.number().nonnegative().optional(),     // NEW
  coverage_percent: z.number().min(0).max(100).optional(),     // NEW
  // ...
})
```

The fields are all optional so spreadsheets (which don't get these populated) still validate. The script only writes them on PDF entries.

### 3. Per-document page redesign (`src/pages/documents/[bates_id].astro`)

Replace the current 2-column split with this structure:

```
┌───────────────────────────────────────────────────────────────────┐
│ <h1>Title</h1>                                                    │
│ <p>Bates ID</p>                                                   │
├───────────────────────────────────────────────────────────────────┤
│ Metadata bar (horizontal grid, full width):                       │
│   Format (Type) | Date | Pages | Source | Download                │
├───────────────────────────────────────────────────────────────────┤
│ Tab buttons:  [ Document ]  [ Document text (83% • ~1,200 c/p) ]  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Tab panel content (full width)                                  │
│                                                                   │
│   - For PDF/Document tab: <embed src=...> at 80vh                 │
│   - For PDF/Text tab: <pre> with the unified text                 │
│   - For Spreadsheet (no tabs): the existing table renderer        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Tab markup** (semantic, accessible, vanilla JS):

```astro
<div class="doc-tabs" role="tablist" aria-label="Document views">
  <button role="tab" id="tab-doc" aria-controls="panel-doc" aria-selected="true" type="button" data-tab="doc">
    Document
  </button>
  <button role="tab" id="tab-text" aria-controls="panel-text" aria-selected="false" type="button" data-tab="text">
    Document text {coverage_percent != null && <small>({coverage_percent}% of pages • ~{avg_chars_per_page} chars/page)</small>}
  </button>
</div>
<div id="panel-doc" role="tabpanel" aria-labelledby="tab-doc">
  <embed src={doc.data.pdf_path} type="application/pdf" />
</div>
<div id="panel-text" role="tabpanel" aria-labelledby="tab-text" hidden>
  {textContent ? <pre>{textContent}</pre> : <p class="empty">No text extracted from this document.</p>}
</div>
```

**Tab switching script** (small, inline):

```ts
const tabs = document.querySelectorAll<HTMLButtonElement>('[role="tab"]');
const panels = document.querySelectorAll<HTMLElement>('[role="tabpanel"]');

function activate(name: string) {
  const valid = name === 'doc' || name === 'text';
  const target = valid ? name : 'doc';
  tabs.forEach((t) => {
    const active = t.dataset.tab === target;
    t.setAttribute('aria-selected', active ? 'true' : 'false');
    t.tabIndex = active ? 0 : -1;
  });
  panels.forEach((p) => {
    p.hidden = !p.id.endsWith(`-${target}`);
  });
}

// Initial state from URL hash
activate((window.location.hash || '#doc').slice(1));

// Click handler
tabs.forEach((t) => {
  t.addEventListener('click', () => {
    const name = t.dataset.tab!;
    activate(name);
    history.replaceState(null, '', `#${name}`);
  });
});

// Browser back/forward
window.addEventListener('hashchange', () => activate(window.location.hash.slice(1)));
```

**Metadata bar markup** (replaces the current `<aside class="meta-pane">` `<dl>`):

```astro
<dl class="doc-meta-bar">
  <div><dt>Format (Type)</dt><dd>{formatType(doc)}</dd></div>
  {doc.data.date && <div><dt>Date</dt><dd>{doc.data.date}</dd></div>}
  {doc.data.page_count && <div><dt>Pages</dt><dd>{doc.data.page_count}</dd></div>}
  <div><dt>Source</dt><dd><a href={doc.data.source_url}>hsgac.senate.gov</a></dd></div>
  <div><dt>Download</dt><dd><a href={downloadHref(doc)}>{downloadLabel(doc)}</a></dd></div>
</dl>
```

Where `formatType()` is:

```ts
function formatType(doc) {
  if (doc.data.format === 'spreadsheet') return 'Spreadsheet';
  return `PDF (${doc.data.doc_type})`;   // e.g., "PDF (testimony)"
}
```

CSS for the metadata bar — flexbox/grid, single row on desktop, wraps gracefully:

```css
.doc-meta-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
  margin: 1rem 0 1.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 0.9rem;
}
.doc-meta-bar div { display: flex; gap: 0.4rem; }
.doc-meta-bar dt {
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.72rem;
  align-self: center;
}
.doc-meta-bar dd { margin: 0; }
```

CSS for the PDF embed — taller now that it's full-width:

```css
.pdf-pane embed { width: 100%; height: 80vh; border: 1px solid var(--color-border); }
```

**For spreadsheets** the page keeps the current single-pane layout but with the metadata bar on top instead of as a sidebar. The "Plain text view" details element stays where it is (below the table).

### 4. Index page filter (`src/pages/documents/index.astro`)

Replace the two columns "Type" and "Format" with one column "Format (Type)" using the same `formatType()` helper.

Add filter chips above the table, matching the pattern at `src/pages/timeline/index.astro` lines 22-49:

```astro
<div class="filters" role="region" aria-label="Filter documents">
  <div class="filter-row">
    <span class="filter-label">Format</span>
    <button class="filter-chip is-active" data-filter="ft" data-value="all" type="button">All</button>
    <button class="filter-chip" data-filter="ft" data-value="PDF (testimony)" type="button">PDF (testimony)</button>
    <button class="filter-chip" data-filter="ft" data-value="PDF (statement)" type="button">PDF (statement)</button>
    <button class="filter-chip" data-filter="ft" data-value="PDF (bundle)" type="button">PDF (bundle)</button>
    <button class="filter-chip" data-filter="ft" data-value="Spreadsheet" type="button">Spreadsheet</button>
  </div>
</div>
```

Each table row gets `data-format-type={formatType(doc)}` so the filter script can match.

Filter script: same chip-and-applyFilters pattern from the timeline page.

(Note: the chip set is generated dynamically from the catalog at build time — if a future document brings in a new combination like "PDF (email)", the chip is added automatically. Avoid hardcoding.)

### 5. Coverage display

On the Document text tab button label, show the coverage inline:

```
Document text (83% • ~1,200 chars/page)
```

In the panel, also show a small header above the `<pre>`:

```
"X of Y pages have extractable text. Avg ~N characters per page."
```

For PDFs where text extraction returned nothing or fewer than 50 chars total (effectively a fully image-only doc with failed OCR), show:

```
"No extractable text was detected in this document. The original PDF is available above."
```

For spreadsheets: no coverage display (single-pane layout doesn't have this tab).

## Critical files

To create:
- `scripts/06-extract-text.mjs` — runs pdf-parse, rewrites `.txt` sidecars, updates catalog with coverage stats

To modify:
- `package.json` + `package-lock.json` — add `pdf-parse` dev dep
- `src/content.config.ts` — add 3 new optional fields to documents schema (`pages_with_text`, `avg_chars_per_page`, `coverage_percent`); also bring `page_count` field into actual use
- `src/content/documents/*.json` — 9 PDF entries get coverage stats added (10 spreadsheets unchanged); script handles this
- `public/documents/*.txt` — 9 PDF sidecars get rewritten (10 spreadsheet sidecars unchanged)
- `src/pages/documents/[bates_id].astro` — full redesign: metadata bar on top, tabs for PDFs, format(type) helper
- `src/pages/documents/index.astro` — combined "Format (Type)" column; filter chips bar above the table; data-format-type on rows; client filter script

## Existing patterns to reuse

- **Filter chip pattern** from `src/pages/timeline/index.astro` lines 22-49 — same chip + script structure, single Format dimension only.
- **Filter chip CSS** is already locally defined on the timeline and glossary pages. We can either (a) duplicate the CSS in this page (consistent with current pattern), or (b) extract to `global.css` to DRY up. The plan goes with (a) — local duplication — because moving to global is a separate refactor and not needed to ship this change.
- **`<details>`/`<summary>` "Plain text view"** on spreadsheets stays as-is.
- **`pdf-parse`** package handles per-page extraction natively; no new system tools needed (no `pdftotext`/`poppler` install required).

## Verification

1. `npm install` (picks up `pdf-parse`).
2. `node scripts/06-extract-text.mjs` — runs cleanly. Spot-check that `wiseman-testimony.txt` (formerly empty/minimal) now has substantial text, since the underlying PDF has a native text layer.
3. `npx astro sync` — schema validation passes (existing entries are still valid; new optional fields where populated).
4. `npm run build` — 26 pages still build clean.
5. `npm test` — 13 tests still pass.
6. Manual checks in `npm run preview`:
   - Visit `/documents/wiseman-testimony/` — see metadata bar on top with `Format (Type): PDF (testimony)`. Two tabs visible. Default is "Document" (PDF embed, ~80vh tall). Click "Document text" — the text appears, with coverage stats in both the tab label and the panel header. URL gains `#text`.
   - Reload at `/documents/wiseman-testimony/#text` — page opens directly to the text tab.
   - Visit `/documents/psi-april-2026-part-1/` — heavily-OCR'd FOIA bundle. Coverage stats should show some less-than-100% number (depends on actual text quality).
   - Visit `/documents/PSI-HHS-000008257443-45-49-examples/` — spreadsheet, single-pane layout, metadata bar on top, table fills width.
   - Visit `/documents/` — filter chips at top: clicking "PDF (testimony)" narrows to 5 rows; "Spreadsheet" narrows to 10; "All" resets.
   - Cross-reference a citation popover: clicking "Read document →" still navigates to the right page.
7. Two commits:
   - `feat(pipeline): unified text extraction with pdf-parse + coverage stats`
   - `feat: tabbed document detail layout, Format(Type) column, index filter`
