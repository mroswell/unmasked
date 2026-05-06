# Unmasked Website — Design Spec

**Date:** 2026-05-06
**Status:** Approved design, not yet implemented
**Source document:** `Senate-PSI-Majority-Staff-Interim-Report-April-29-2026-FINAL.pdf` (U.S. Senate Permanent Subcommittee on Investigations, Chairman Ron Johnson, Majority Staff Interim Report — *Unmasked: How Biden Health Officials Purposely Turned a Blind Eye Toward COVID-19 Vaccine Safety Signals*, released in conjunction with the April 29, 2026 PSI hearing).

## 1. Overview

A static website that presents the contents of the PSI interim report — and the underlying Bates-stamped HHS records published by the Subcommittee — in three integrated modes:

1. **Narrative explainer** — a plain-language rewrite of the report's findings, accessible to readers without a pharmacovigilance background.
2. **Interactive timeline** — the dated chronology from Section II of the report, navigable, with each event linked to its citations and (where available) the underlying documents.
3. **Document archive** — every Subcommittee-published exhibit (the testimony PDFs, the chairman's statement, and the individually-posted Bates-stamped attachments), downloaded, OCR'd, and made searchable.

A glossary with mouseover/tap definitions is woven through every page so unfamiliar terms (masking, MGPS, RGPS, EB05, VAERS, CBER, etc.) are explained in context.

### 1.1 Editorial framing

The site adopts a **neutral, evidence-first** voice. It does not reproduce the report's partisan framing as its own. Instead it centers the underlying data — the masking phenomenon, the MGPS vs. RGPS comparison, the contemporaneous emails and analyses — and treats the PSI report as one source among others (alongside witness testimony, FOIA productions, and Szarfman/DuMouchel's published papers).

The `/about/` page makes this framing explicit and notes the site is not affiliated with the Subcommittee.

### 1.2 Audience

General-interest readers without prior knowledge of vaccine safety surveillance. The site assumes the reader has heard of VAERS but knows nothing about disproportionality analysis, data mining algorithms, or FDA org structure.

### 1.3 Non-goals

- The site does not advocate for or against COVID-19 vaccination.
- The site does not host user-submitted content, comments, or annotations (in MVP).
- The site does not attempt to mirror the entire VAERS database or run independent statistical analyses.

## 2. Information architecture

```
/                          Home — overview + entry to the three modes
/explainer/                Narrative: what masking is and what happened
/timeline/                 Chronological view (Nov 2020 → 2026)
/timeline/#YYYY-MM-DD      Auto-expands to a specific event
/documents/                Document archive (filterable index)
/documents/<bates-id>/     Per-document page (PDF + OCR text + metadata)
/quotes/                   Browseable evidence wall (filterable by speaker/topic)
/glossary/                 Full glossary; terms also surface as inline tooltips
/about/                    Site purpose, methodology, sourcing, contact
/search/                   Full-text search across all content (Pagefind)
```

All links are relative — the site drops cleanly into a subdirectory or moves to a subdomain without code changes.

### 2.1 Per-event timeline behavior

- Timeline events are collapsed by default (date + one-line summary).
- Clicking an event expands it inline (full prose + citation list + key quotes).
- An "Expand all / Collapse all" toggle sits at the top of `/timeline/`.
- URL fragment `/timeline/#2021-03-26` auto-expands and scrolls to that event on load.
- Print stylesheet forces all events expanded so the timeline prints as one continuous document.
- Each event is indexed as a separate Pagefind record so search results land on the correct event, not the top of the page.

### 2.2 Future migration

The site is built standalone now, in this directory. Two future hosting paths are both supported:

- **Subdirectory** of an existing site (e.g., `coviddocuments.com/signals/`): drop the `dist/` output into the parent repo's `/signals/` directory.
- **Subdomain** (chosen: `signals.coviddocuments.com`): give the project its own GitHub repo with a `CNAME` file and a DNS record. Cleaner separation; the URL space stays clean. (See `docs/deploy/subdomain-setup.md` for step-by-step.)

Either way, all internal links remain valid.

## 3. Content model

Six content collections, all stored in the repo. Astro content collections validate the schema at build time so missing fields, broken cross-references, and typos fail the build rather than silently rendering broken pages.

### 3.1 Timeline events
**Path:** `content/timeline/<date>.md` (one file per event)
**Format:** Markdown body with YAML frontmatter

```yaml
date: 2021-03-26              # ISO; primary key & URL fragment
date_display: "March 26, 2021" # human-readable; supports ranges like "March 17-18, 2021"
summary: "Szarfman shares 49 examples of extreme masking..."
actors: [szarfman, dumouchel, menschik, baer, zinderman]
citations: [fn-117, fn-118, fn-119]
tags: [analysis, internal-pushback]
---
Markdown body — full prose for this event, supporting nested bullets and sub-events.
```

### 3.2 Citations
**Path:** `content/citations.json`
**Format:** array of records, one per footnote in the source report

```json
{
  "id": "fn-117",
  "bates_ids": ["PSI-HHS-000008263190-91"],
  "footnote_text": "PSI-HHS-000008263190-91 (emphasis added).",
  "document_id": "PSI-HHS-000008263190-91",
  "external_url": null,
  "emphasis_note": "(emphasis added)"
}
```

A citation may link to a document (`document_id` populated), to an external URL only (`external_url` populated, `document_id` null), or to neither (both null — the cited Bates document was not publicly posted). The "neither" case is common and is rendered honestly.

### 3.3 Glossary terms
**Path:** `content/glossary/<term-slug>.md`
**Format:** Markdown body with YAML frontmatter

```yaml
term: "masking"
aliases: ["mask", "masked", "extreme masking"]
short_def: "A statistical phenomenon where signals from one product are hidden by signals from other products in the same dataset."
category: "statistical-method"
---
Longer explanation for the /glossary/ page — paragraphs, examples, references.
```

The `aliases` array drives the build-time auto-wrap pass that injects `<dfn>` tags into prose content (see §6.1).

### 3.4 Documents
**Path:** `content/documents/<bates-id>.json`
**Format:** one JSON file per document

```json
{
  "bates_id": "PSI-HHS-000008257443-45",
  "title": "49 examples of extreme masking (Szarfman attachment)",
  "doc_type": "spreadsheet",
  "date": "2021-03-26",
  "page_count": 3,
  "source_url": "https://www.hsgac.senate.gov/.../psi-hhs-000008257443-45-attachment-49-examples-of-extreme-masking/",
  "pdf_path": "/documents/PSI-HHS-000008257443-45.pdf",
  "ocr_text_path": "/documents/PSI-HHS-000008257443-45.txt",
  "split_from": null
}
```

`doc_type` ∈ `email | presentation | spreadsheet | paper | letter | testimony | report | other`. `split_from` is null for standalone documents, or the parent bundle's ID for documents extracted from a multi-document production (post-MVP).

### 3.5 Actors
**Path:** `content/actors.json`
**Format:** flat array

```json
{
  "id": "szarfman",
  "name": "Dr. Ana Szarfman",
  "role_at_time": "Senior Medical Officer & Safety Data Mining Developer, FDA CDER",
  "short_bio": "Co-developer of FDA's data mining system; advocated for the RGPS method during COVID-19 vaccine safety surveillance."
}
```

Mentions in event prose use `[Szarfman](#actor-szarfman)`. Click opens a small popover card. A dedicated `/people/` page is post-MVP.

### 3.6 Key quotes
**Path:** `content/quotes/<quote-slug>.json`
**Format:** one JSON file per quote

```json
{
  "id": "marks-anti-vaccination-rhetoric",
  "speaker": "marks",
  "date": "2021-04",
  "text": "create erroneous conflicts that feed in to anti-vaccination rhetoric",
  "context": "Marks warning Cavazzoni about Szarfman's data mining concerns.",
  "emphasis_words": [],
  "citation_id": "fn-9",
  "topic": ["pushback", "framing"]
}
```

Used three ways: a `/quotes/` index (browseable, filterable by speaker/topic), inline pull-quotes inside explainer/timeline, and as a Pagefind-indexed source.

### 3.7 Cross-reference validation

`document_id` on a citation is optional. If absent or null, the citation simply has no backing document and renders accordingly (see §5.2). If present, it must resolve to a real document.

Build fails if:
- A `citation` ID referenced by a timeline event doesn't exist in `citations.json`.
- A *non-null* `document_id` in `citations.json` doesn't have a matching file in `content/documents/`.
- An `actor` ID referenced anywhere doesn't exist in `actors.json`.
- A glossary alias collides with another glossary alias.

## 4. Document pipeline

The pipeline runs **outside the Astro build**, on the maintainer's machine. Outputs are committed to the repo. All scripts live in `scripts/` and are coordinated via `make` (or `npm run pipeline`). All stages are idempotent.

### 4.1 Stage 1 — Download (`scripts/01-download.sh`)
- Reads a manifest of source URLs (the report, the chairman's statement, 4 testimony PDFs, ~10 individual attachments, 3 bundled Parts).
- Fetches each to `raw/<filename>.pdf` with `curl`.
- Records URL, fetched-at, sha256, byte size in `raw/manifest.json`.
- Skips files already present unless `--force`.

### 4.2 Stage 2 — OCR (`scripts/02-ocr.sh`)
- Wraps `ocrmypdf` (Tesseract under the hood).
- For each `raw/*.pdf`, produces:
  - `ocr/<filename>.pdf` — searchable PDF with text layer
  - `ocr/<filename>.txt` — plain-text sidecar (Pagefind input)
  - `ocr/<filename>.meta.json` — page count, OCR confidence summary, language
- Uses `--skip-text` so text-layer PDFs (like the report itself) pass through.
- Re-OCRs only when source file hash changes.

### 4.3 Stage 3 — Split bundles (`scripts/03-split.py`) — *deferred past MVP*
- Operates only on the "Part 1/2/3" bundles.
- Parses Bates stamps from each page's OCR text via regex (`PSI-HHS-\d{9}(-\d+)?`).
- Detects document boundaries via Bates-number jumps, email header patterns, and blank-page sentinels.
- Writes **split proposals** to `split-proposals/<bundle>.json` for human review — does not produce final splits automatically.
- A small CLI lets the maintainer confirm or adjust splits before they become real document files.
- For MVP, bundles enter the catalog as single documents with a "this is a multi-document bundle, individual records pending" notice.

### 4.4 Stage 4 — Build catalog (`scripts/04-catalog.py`)
- Walks `ocr/` and writes one `content/documents/<bates-id>.json` per document.
- Detects `bates_id` from filename (the hearing page already names attachments after their Bates range) or from first-page OCR.
- Heuristically classifies `doc_type` (email if "From:/To:/Subject:" found, presentation if many short pages, etc.); flags low-confidence cases for manual review in a `catalog-review.json` report.
- Copies (or symlinks) PDFs into `public/documents/` so Astro serves them as static assets.

### 4.5 Stage 5 — Cross-reference (`scripts/05-citations.py`)
- Extracts every Bates ID mentioned in the report's text (and, in later phases, in the timeline event prose).
- Updates `content/citations.json` so each footnote knows whether its `document_id` exists in the catalog.
- Prints a report: "X citations have backing documents, Y citations do not, Z citations point inside an unsplit bundle."

### 4.6 OCR/derived artifacts in git

OCR'd PDFs and sidecar text are committed to the repo. The corpus is small enough (~20 source PDFs, post-OCR likely under 200MB) that this is fine and keeps the site reproducible from a single clone. If size becomes a problem in M3+, derived artifacts can move to Git LFS or be regenerated on a CI machine.

## 5. UI components

### 5.1 Glossary tooltips
- Built on the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). No JS framework dependency.
- Build-time pass auto-wraps glossary term occurrences in markdown content with `<dfn data-term="masking">masking</dfn>`.
- Default: only the first occurrence per page is wrapped, to avoid visual noise.
- Opt-out: `<span data-no-gloss>masking</span>` for cases where the word is used in a non-jargon sense.
- Desktop: hover (with delay) opens popover. Mobile: tap opens popover with explicit close button.
- Popover content: short definition + "full entry →" link to `/glossary/#<term>`.

### 5.2 Citations / footnotes
- `[^fn-117]` markers in markdown render as small superscript numbers.
- Click a number → popover with: footnote text, Bates ID, and one of:
  - "Read document →" link, if `document_id` resolves to a real document
  - "Document not publicly posted" — citation has Bates ID but no public version
  - "Inside Part 2 bundle, extraction pending" — Bates ID falls inside a known bundle
  - "External source →" link if `external_url` is set
- Each citation is addressable as `#fn-117`.

### 5.3 Document viewer (`/documents/<bates-id>/`)
Two-column layout on desktop, stacked on mobile:

```
┌────────────────────────────────────────┬──────────────────────────┐
│  Embedded PDF (browser-native viewer)  │  Metadata                │
│                                        │  - Bates ID              │
│                                        │  - Type                  │
│                                        │  - Date                  │
│                                        │  - Source URL            │
│                                        │                          │
│                                        │  Referenced in:          │
│                                        │  - Timeline 2021-03-26   │
│                                        │  - Footnotes fn-4, fn-117│
│                                        │                          │
│                                        │  OCR text  (collapsible) │
│                                        │  ──────────              │
│                                        │  [searchable text...]    │
└────────────────────────────────────────┴──────────────────────────┘
```

PDF is rendered via `<embed>` or `<iframe>` using whatever PDF viewer the user's browser provides (no PDF.js dependency for MVP). The OCR text is rendered as plain HTML below/beside the viewer for in-page Ctrl-F search and for Pagefind indexing. Mobile: PDF + metadata stack; OCR text collapsed by default.

PDF.js is a possible upgrade in M3+ if per-page deep-linking (`/documents/foo/#page=3`) becomes valuable.

### 5.4 Search
- **Tooling:** Pagefind, build-time index, client-side search (no backend).
- **Global search:** in the site header, on every page.
- **Section-scoped search:** each section index page (`/timeline/`, `/documents/`, `/quotes/`, `/glossary/`) has its own search box pre-applying a `content-type` filter.
- Results show title, content-type badge, and a snippet with highlighted match.
- Keyboard accessible: `/` focuses search, arrows navigate results, Enter opens.
- Pagefind tags applied via `data-pagefind-filter="content-type:timeline"` etc. on each page section.

### 5.5 Timeline interactions

(See §2.1 for the URL/expand semantics.)

- Each event row: date, one-line summary, expand affordance.
- Expanded body: prose, citation list, key quotes for that event, "Copy link" button (writes `#YYYY-MM-DD` URL to clipboard).
- "Expand all / Collapse all" toggle at top.
- Print stylesheet forces all events expanded.
- Optional filter chips by tag (e.g., "internal-pushback", "data-mining-method").

### 5.6 Actor mentions
- `[Szarfman](#actor-szarfman)` markdown renders as a styled link with subtle indication it opens an actor card.
- Click → small popover with name, role at the time, short bio, and a placeholder link to `/people/<id>/` (live in M4).

### 5.7 Key quotes
Three rendering modes:
1. **Inline pull-quotes** — large indented quote with attribution, used in explainer and timeline event bodies.
2. **Quote cards** on `/quotes/` — filterable grid by speaker and topic.
3. **Pagefind-indexed** — searching for a quote's phrase lands on its context.

### 5.8 Share buttons
- Per-page share affordance (footer area or sidebar): X/Twitter, Bluesky, Mastodon, Facebook, LinkedIn, copy-link, email.
- Each page kind picks the relevant subset (e.g., document pages may emphasize copy-link).
- No tracking pixels. Static `mailto:` and pre-filled URL share endpoints only.

### 5.9 Visual / typographic direction
- **Restrained, evidence-first.** Typography and layout do the work; decoration does not.
- Serif body text (e.g., Charter, Source Serif, or Newsreader). Sans-serif UI (Inter or system-ui).
- Near-black on near-white. Single muted accent color (e.g., a teal or navy) for links and active states. No reds, no alarmist styling.
- Generous line-height (1.6–1.7) on prose; clear hierarchy.
- Print stylesheets for `/explainer/` and `/timeline/`.
- Mobile-first: every interaction tested on touch first.

## 6. Build / tech stack

- **Framework:** Astro (latest stable). Content collections for type-safe content. Native MDX support for prose.
- **Search:** Pagefind, integrated as a post-build step.
- **Tooltips/popovers:** native HTML Popover API + small CSS. No framework.
- **PDF viewer:** browser-native via `<embed>` for MVP.
- **Styling:** CSS (or Tailwind if ergonomic — decision deferred to implementation).
- **OCR pipeline:** `ocrmypdf` (system tool, installed via Homebrew) + small Python/shell scripts.
- **Build/CI:** GitHub Actions builds and deploys to GitHub Pages on push to `main`.

## 7. Phasing / milestones

### M0 — Skeleton (≈ half a day)
Astro project scaffolded; page templates for `/`, `/explainer/`, `/timeline/`, `/documents/`, `/glossary/`, `/quotes/`, `/about/`. Content collection schemas defined. Pagefind wired up. Deploys to GitHub Pages with placeholder text. No real content yet.

### M1 — Content from the report (≈ 2-3 days)
- Timeline events extracted from the PDF (~50-60 entries).
- Glossary populated (~25 terms: masking, MGPS, RGPS, GPS, EB data mining, EB05, VAERS, EUA, CBER, CDER, OBPV, signal, disproportionality, confounding, etc.).
- `citations.json` populated — every footnote becomes one record.
- Key quotes selected (~30-50 striking lines).
- Actors listed.
- Plain-language explainer drafted (Claude drafts, maintainer edits) as a rewrite of the report's executive summary.
- Result: full reading experience. All citations are text-only — no document links yet.

### M2 — Individual documents integrated (≈ 1-2 days) — *launch threshold*
- Pipeline runs Stages 1, 2, 4, 5 on the ~15 standalone PDFs (chairman's statement, 4 testimonies, ~10 individual attachments).
- `citations.json` updated with `document_id`s where Bates ranges match.
- Each document gets its own page (PDF viewer + OCR text + cross-references).
- The 3 bundle PDFs are imported as single documents with a "split pending" notice.
- **Result:** site is shippable. Roughly 30-50% of citations have clickable backing documents.

### M3 — Bundle splitting (open-ended)
- Stage 3 (split script + review CLI) implemented.
- Run on Parts 1/2/3 with maintainer review of split proposals.
- Catalog grows; many more citations get linked.

### M4 — Polish & migration
- `/people/` page, topic-based timeline filters, "cite this page" tool, share button refinements.
- Move to `signals.coviddocuments.com` (CNAME + DNS).
- Optional: PDF.js upgrade for per-page deep-linking; annotations/comments layer.

## 8. Repo structure

```
.
├── astro.config.mjs
├── package.json
├── content/
│   ├── timeline/             one .md per event
│   ├── glossary/             one .md per term
│   ├── documents/            one .json per document
│   ├── quotes/               one .json per quote
│   ├── citations.json
│   └── actors.json
├── public/
│   └── documents/            served PDFs + OCR text
├── raw/                      downloaded source PDFs (committed)
├── ocr/                      OCR'd PDFs + sidecars (committed)
├── scripts/
│   ├── 01-download.sh
│   ├── 02-ocr.sh
│   ├── 03-split.py           (M3)
│   ├── 04-catalog.py
│   └── 05-citations.py
├── src/
│   ├── pages/
│   ├── layouts/
│   ├── components/
│   └── styles/
└── docs/
    └── specs/
        └── 2026-05-06-unmasked-website-design.md   (this file)
```

## 9. Open questions (to resolve during implementation)

- **Tailwind vs. plain CSS** — defer to M0 implementation; not load-bearing for the design.
- **Exact glossary term list** — finalized during M1 content extraction.
- **Topic taxonomy for tags and quote topics** — emerges during M1 content work.
- **Whether to commit OCR'd PDFs or use Git LFS** — start with plain git; revisit only if repo size becomes a problem.
