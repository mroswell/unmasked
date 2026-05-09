# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, evidence-first website at **https://vsafetysignals.com** presenting the U.S. Senate Permanent Subcommittee on Investigations' April 2026 majority-staff interim report on COVID-19 vaccine safety signal masking, together with the Bates-stamped HHS records, witness testimony, and other exhibits the Subcommittee published with it.

The site is not affiliated with the Subcommittee. The site's brand name is **Vaccine Safety Signals**; the report's title (a separate thing) is "Unmasked: How Biden Health Officials Purposely Turned a Blind Eye Toward COVID-19 Vaccine Safety Signals" — that exact phrase appears verbatim in About, the April 29 2026 timeline event, and witness testimony OCR text and **must not** be rebranded.

## Commands

- `npm run dev` — Astro dev server with HMR. Search affordances render but Pagefind 404s silently because the index isn't built in dev (this is expected).
- `npm run build` — `astro build && pagefind --site dist`. Produces `dist/` ready to deploy. Pagefind index is built from any element marked `data-pagefind-body`.
- `npm run preview` — serves the built `dist/` locally. Pagefind search works here; dev does not.
- `npm run test` / `npm run test:watch` — Vitest. (No tests currently committed; the runner is wired up for future use.)

There is **no lint or typecheck command** in `package.json`. Astro's build does its own type-aware processing of `.astro` files; component-level TypeScript errors surface during `npm run build`.

## Big-picture architecture

### Content collections (`src/content.config.ts`)

Six collections, each with a Zod schema:

- **timeline** (`src/content/timeline/*.json`) — one file per event, `body` is markdown. Each event has `actors[]`, `citations[]` (fn-id refs), `tags[]`, `category`, `date`.
- **glossary** (`src/content/glossary/*.md`) — terms with aliases. Aliases are auto-wrapped in body text by the `remark-glossary` plugin.
- **documents** (`src/content/documents/*.json`) — one file per published exhibit (testimony, FOIA bundles, spreadsheets). `bates_id` is the slug.
- **quotes** (`src/content/quotes/*.json`) — pull-quotes with `speaker` (actor id) and `citation_id` (fn-id ref).
- **actors** (single `src/content/actors.json`) — people (FDA scientists, witnesses, senators). `id` is the slug used by `/people/<id>/`.
- **citations** (single `src/content/citations.json`) — every footnote in the report, keyed `fn-N`. The most data-dense file in the project.

`src/lib/build-validate.ts` runs at build start (called from `src/pages/index.astro` frontmatter) to cross-check that timeline events reference known actor ids, citations resolve, and document references exist.

### The citation chain (most important non-obvious flow)

When a markdown body contains `[^fn-N]`:

1. `src/lib/remark-citations.ts` (a remark plugin in the markdown pipeline) replaces the marker with a `<button popovertarget="popover-fn-N">[N]</button>` plus a `<span popover>...</span>` payload.
2. The popover content is sourced from `src/content/citations.json` keyed by `fn-N`.
3. **Link priority (mirrored in `src/components/Citation.astro` and `remark-citations.ts`):**
   1. `document_id` set → "Read document →" linking to `/documents/<id>/`
   2. `bates_ids` resolve to a bundled-PDF page via `src/lib/bates-page-lookup.ts` → renders **two** links: "Read PDF (page N) →" and "View as text →" with URL hashes `#doc-page-N` and `#text-page-N`
   3. `external_url` set → "External source →"
   4. otherwise → "Document not publicly posted" (today, **fn-30 only** falls here, and it isn't currently rendered anywhere)

The bates-page resolver reads `public/documents/<bundle>-bates-index.json` files (built once by `scripts/build-bates-page-index.mjs`). Those index files map every Bates ID detected in the bundled PDFs (`psi-april-2026-part-1/2/3.pdf`) to its 1-based page number.

The document detail page (`src/pages/documents/[bates_id].astro`) parses the URL hash on load and (a) sets the embed `src` to `bundle.pdf#page=N` for the doc tab, (b) scrolls to a `<a id="text-page-N">` anchor for the text tab. Per-page text is read from `public/documents/<bundle>-pages.json`, also produced by the index builder.

### `Id.` citation inheritance

`Id.`-form footnote citations (e.g. *"Id."*, *"Id. at 3."*) inherit their link source (document_id / bates_ids / external_url) from the immediately preceding citation. This is **applied in-place to `citations.json`** by `scripts/resolve-id-citations.mjs` (idempotent; safe to re-run after upstream changes). It is *not* a render-time inheritance — the JSON is modified.

### M2 ingestion pipeline (`scripts/0*.sh|.mjs`)

Numbered-prefix scripts run in order to ingest source documents. They are run by hand (not on every build):

1. `01-download.sh` — fetches PDFs/XLSX listed in `download-manifest.json` into `raw/`
2. `02-ocr-pdfs.sh` — OCRs PDFs via `ocrmypdf`
3. `02-parse-xlsx.mjs` — XLSX → JSON tables
4. `04-catalog.mjs` — `raw/` → `src/content/documents/*.json`
5. `05-cross-reference.mjs` — checks citation references against the catalog
6. `06-extract-text.mjs` — emits `.txt` sidecars from PDFs
7. `07-rewrite-paths-for-base.mjs` — **deprecated**; was needed when `base` was `/unmasked/`. Kept on disk as a safety belt but no longer wired into `npm run build`.

The bates-page index (`scripts/build-bates-page-index.mjs`) is a separate, also-by-hand tool that runs over the bundled PDFs and emits the per-bundle `*-bates-index.json` and `*-pages.json` files in `public/documents/`. Run it whenever a new bundle is added.

### URL / deploy

- Astro config: `site: 'https://vsafetysignals.com'`, `base: '/'`, `trailingSlash: 'always'`, `output: 'static'`, `build: { format: 'directory' }`.
- `public/CNAME` contains `vsafetysignals.com`. GitHub Pages reads it on deploy.
- All hand-written hrefs in pages/components use `import.meta.env.BASE_URL` (e.g. `` href={`${base}timeline/`} ``) so they remain correct if `base` ever changes back to a subpath. **Do not introduce raw `/timeline/` hrefs**; follow the existing pattern.
- Inline scripts that need the base at runtime use Astro's `define:vars` to inject it (see `SearchBox.astro`, `GlossaryTooltips.astro`).
- The legacy `mroswell.github.io/unmasked/...` URL still works via GitHub Pages' auto-redirect to `vsafetysignals.com`.

### Glossary tooltips

`src/lib/remark-glossary.ts` wraps known terms in markdown bodies with `<dfn data-term="...">`. `src/components/GlossaryTooltips.astro` is loaded once in `BaseLayout` and (a) attaches `data-tooltip` attributes from a runtime-fetched `glossary-shortdefs.json`, (b) walks plain-text scopes (`main article`, `.prose-page`, `.prose`) to wrap *first occurrences* of canonical terms that the remark plugin didn't catch (i.e. content authored directly in `.astro` templates, not markdown). The fetched JSON files are emitted at build time by `src/lib/emit-shortdefs.ts`, called from `astro.config.mjs`.

### Things that look weird but are intentional

- **"Unmasked" string occurrences** in `src/pages/about/index.astro`, the April 29 2026 timeline event, and `public/documents/*-testimony.txt` — these are quotations of the report's actual title or hearing name. Site brand is "Vaccine Safety Signals."
- **`scripts/07-rewrite-paths-for-base.mjs`** exists but isn't called by `npm run build` anymore; safety belt for a hypothetical return to a subpath deploy.
- **Repo name on GitHub is `mroswell/unmasked`** (legacy from before the rename to Vaccine Safety Signals). Renaming the repo would break the legacy `mroswell.github.io/unmasked/` redirect, so it stays for now.
- **Plan / decision records live in `docs/plans/`** as date-prefixed markdown files. They document why content decisions were made (credential conventions, citation inheritance, domain migration). Read these when modifying related areas — they often have rationale not in the code.
