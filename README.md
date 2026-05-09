# Vaccine Safety Signals

An evidence-first website presenting the U.S. Senate Permanent Subcommittee on Investigations' April 2026 majority-staff interim report on COVID-19 vaccine safety signal masking, alongside the Bates-stamped HHS records, witness testimony, and other exhibits the Subcommittee published with it.

**Live at: https://vsafetysignals.com**

This site is independent and not affiliated with the Subcommittee.

## What's on the site

- **Explainer** — plain-language introduction to safety signal masking.
- **Timeline** — dated chronology from November 2020 to today, with citations and source documents.
- **Documents** — searchable archive of every Subcommittee-published exhibit, with full-text search inside the bundled PDFs.
- **Quotes** — pull-quotes from FDA, CDC, and Subcommittee correspondence.
- **People** — named individuals in the record (FDA scientists, agency officials, witnesses, oversight personnel).
- **Glossary** — pharmacovigilance terms used throughout.

Every footnote in the report is wired up to its source: clicking a `[N]` marker opens a popover with the footnote text and a link to the underlying record (a specific page of a bundled PDF, an external source, or — rarely — a notice that the document isn't publicly posted).

## Local development

Requires Node.js (the project is an Astro 5 site).

```bash
npm install
npm run dev      # dev server with hot-reload at http://localhost:4321/
npm run build    # produces static site in dist/
npm run preview  # serves the built dist/ locally; full search works here
npm run test    # runs Vitest (no tests committed yet)
```

In `npm run dev`, full-text search returns 404s silently because the Pagefind index is only built during `npm run build`. Use `npm run preview` if you want to test search locally.

## Project layout

```
src/
  content/         # the corpus, as content collections
    timeline/      # one event per JSON file
    documents/     # one exhibit per JSON file
    quotes/        # one pull-quote per JSON file
    glossary/      # one term per markdown file
    actors.json    # all named people
    citations.json # every footnote in the report
  components/      # Astro components (Citation, TimelineEvent, etc.)
  layouts/         # BaseLayout
  lib/             # remark plugins, validators, citation lookup
  pages/           # routes
  styles/          # global.css

public/documents/  # PDFs, OCR text, spreadsheet JSON, per-bundle Bates page indices
scripts/           # ingestion + maintenance scripts (see CLAUDE.md)
docs/plans/        # date-prefixed decision records
```

## Tech stack

- **Astro 5** static site generator
- **Pagefind** for build-time full-text search across all content
- **remark** with custom plugins for inline citations and glossary tooltips
- **pdf-parse** for per-page PDF text extraction (used by the Bates-page index)
- **Vitest** test runner
- **GitHub Pages** for hosting (custom apex domain via `public/CNAME`)

## Adding content

The most common kind of content edit is adding a new timeline event. Each event is a single JSON file in `src/content/timeline/` matching the schema in `src/content.config.ts`. The build runs `runBuildValidation()` to catch references to unknown actors, unresolved citation ids, or missing documents.

Citations live in `src/content/citations.json`. The render priority is: `document_id` → bundle deep-link via `bates_ids` → `external_url` → unavailable. See `CLAUDE.md` for the full citation chain.

For a deeper architectural overview, see `CLAUDE.md`.
