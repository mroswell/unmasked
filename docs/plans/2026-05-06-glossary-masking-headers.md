# Add masking-table column definitions to the Glossary; add Source filter + search

## Context

Document pages now render the parsed Excel spreadsheets as inline HTML tables — including the central "49 examples of extreme masking" table at `/documents/PSI-HHS-000008257443-45-attachment-49-examples-of-extreme-masking/`. That table has 13 columns of pharmacovigilance jargon: `Vaccine Type + Manufacturer`, `Event: PT_plus_SMQ`, `N`, `E`, `ER05`, `ERAM`, `ER95`, `EB05`, `EBGM`, `EB95`, `RR`, `PRR`, `PRR_CHISQ`. A reader without a pharmacovigilance background can't make sense of these without help.

Two related issues fall out of this:

1. The current 28-term glossary mixes terms that are formally defined in the report (4 of them, in the PDF Glossary section pp. 32-34) with 24 editorial additions we created in M1. Readers should be able to tell which is which.
2. The glossary page has no in-page search — only the global Pagefind search reaches it, and that's overkill when you just want to filter a single page's term list.

## What each column stands for

Sanity-check this interpretation before we adopt these as glossary definitions. Stop me if anything looks off.

| Column | Stands for | Plain-language gloss |
|---|---|---|
| **Vaccine Type + Manufacturer** | — | The vaccine product (e.g., "COVID19 VACCINE-MODERNA"). |
| **Event: PT_plus_SMQ** | MedDRA **Preferred Term** OR **Standardized MedDRA Query** | The adverse-event identifier. Each row is either a specific symptom (PT) or a clinical concept group (SMQ) like "Cardiac arrhythmias terms". |
| **N** | Observed count | How many adverse-event reports actually appear in VAERS for this product+event pair. |
| **E** | Expected count | How many you'd expect under the null hypothesis (no association), computed from the marginal totals of the contingency table. |
| **EB05 / EBGM / EB95** | **E**mpirical **B**ayes 5th percentile / **G**eometric **M**ean / 95th percentile | The MGPS posterior credible interval for the relative reporting ratio. EBGM is the central (geometric-mean) shrinkage estimate; EB05 and EB95 are the 5th and 95th percentiles. **FDA's signal threshold is EB05 > 2.0.** |
| **ER05 / ERAM / ER95** | **E**mpirical **R**egression-adjusted 5th / **A**djusted **M**ean / 95th | The RGPS counterparts. Same shape (5th / mean / 95th) but with a regression layer that adjusts for stratification confounders that masking can hide. ERAM is the central estimate. |
| **RR** | Relative Reporting ratio | N / E. The raw disproportionality with no Bayesian shrinkage — sensitive to small counts. |
| **PRR** | Proportional Reporting Ratio | A different disproportionality metric (the one MHRA traditionally uses): (events for product / total reports for product) ÷ (events for other products / total reports for other products). |
| **PRR_CHISQ** | PRR Chi-squared statistic | The chi-squared test statistic associated with the PRR — used to gauge statistical significance of the PRR value. |

## Plan

### 1. Add 12 new glossary entries

All in `src/content/glossary/`. Same markdown frontmatter format as existing entries. Each gets `source: "additional"` (the new field — see step 3) except `empirica-signal.md` which is `source: "original"`. Aliases are chosen so the build's existing remark-glossary plugin auto-wraps occurrences in prose AND so search finds each acronym.

| New file | Term | Aliases | Category |
|---|---|---|---|
| `n.md` | "N" | ["observed count"] | metric |
| `e.md` | "E" | ["expected count"] | metric |
| `ebgm.md` | "EBGM" | ["EB95", "Empirical Bayes Geometric Mean"] | metric |
| `eram.md` | "ERAM" | ["ER05", "ER95", "Empirical Regression-Adjusted Mean"] | metric |
| `rr.md` | "RR" | ["Relative Reporting Ratio", "Relative Risk"] | metric |
| `prr.md` | "PRR" | ["Proportional Reporting Ratio"] | metric |
| `prr-chisq.md` | "PRR_CHISQ" | ["PRR chi-squared"] | metric |
| `pt.md` | "PT" | ["Preferred Term", "MedDRA Preferred Term"] | regulatory |
| `smq.md` | "SMQ" | ["Standardized MedDRA Query"] | regulatory |
| `pt-plus-smq.md` | "PT_plus_SMQ" | ["PT+SMQ"] | regulatory |
| `meddra.md` | "MedDRA" | ["Medical Dictionary for Regulatory Activities"] | regulatory |
| `empirica-signal.md` | "Empirica Signal" | ["Empirica"] | system, **source: "original"** |

`empirica-signal.md` is included because the report's PDF glossary defines it as a Key Term (page 33) but we never created a separate entry — it was previously folded into `eb-data-mining.md`. Adding it brings the original-glossary set from 4 entries to the full 5 the PDF defines.

### 2. Update existing `eb05.md`

Currently defines only EB05. Add a paragraph that places it in the EB triplet (EB05 / EBGM / EB95) and notes the relationship: EB05 is the lower bound of the 90% credible interval whose central tendency is EBGM. Cross-link to `ebgm.md`. Keep the existing FDA signal-threshold note (EB05 > 2.0).

### 3. Add `source` field to glossary schema

In `src/content.config.ts`, modify the glossary collection schema:

```ts
const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
  schema: z.object({
    term: z.string(),
    aliases: z.array(z.string()).default([]),
    short_def: z.string().max(280),
    category: z.string().optional(),
    source: z.enum(['original', 'additional']).default('additional'),  // NEW
  }),
});
```

The `.default('additional')` means existing files without an explicit `source` field don't break the build. We'll explicitly set `source: "original"` on the five entries from the report's own glossary.

### 4. Backfill `source: "original"` on the 5 original-glossary entries

Edit frontmatter to add `source: "original"` on:

- `src/content/glossary/masking.md`
- `src/content/glossary/mgps.md`
- `src/content/glossary/rgps.md`
- `src/content/glossary/eb-data-mining.md`
- `src/content/glossary/empirica-signal.md` *(new in step 1, already has `source: "original"`)*

All other entries (24 existing + 11 new) inherit the `additional` default — no edit needed.

### 5. Rebuild glossary index page with filter + search

Replace `src/pages/glossary/index.astro` with a version that:

- Renders the same `<dl>`/`.entry` structure as today
- Adds two affordances above the list:
  1. **Search box** — input field with `placeholder="Search glossary…"`. Filters as you type. Matches against `term`, `aliases`, and `short_def` (case-insensitive substring match). Body text isn't included to keep `data-search-text` attributes small; users who need full-text glossary search use the global Pagefind search.
  2. **Source filter chips** — three chips matching the timeline page's pattern: `All` / `Original report terms` / `Additional terms`. Single-select. Reuse the existing `.filter-chip` styling from the timeline page (duplicate the relevant CSS locally — fine for this scope; can extract to `global.css` later if other pages need filter chips).
- Each entry gets `data-source={term.data.source}` and `data-search-text={composite}` attributes so the client script doesn't recompute on every keystroke.
- Search and filter AND together. Empty-state notice if nothing matches.

Pseudocode for the script (TypeScript inside `<script>`):

```ts
const state = { source: 'all', q: '' };
const entries = document.querySelectorAll<HTMLElement>('.entry');
const empty = document.querySelector<HTMLElement>('.empty-state');

function applyFilters() {
  const q = state.q.toLowerCase();
  let visible = 0;
  entries.forEach((el) => {
    const src = el.dataset.source!;
    const text = el.dataset.searchText!;
    const sourceOk = state.source === 'all' || src === state.source;
    const queryOk = q === '' || text.includes(q);
    el.hidden = !(sourceOk && queryOk);
    if (sourceOk && queryOk) visible++;
  });
  if (empty) empty.hidden = visible > 0;
}
// chip click → set state.source + toggle is-active class
// search input event → set state.q
// both call applyFilters()
```

The `data-search-text` attribute is built server-side at render time:

```astro
const searchText = [
  term.data.term,
  ...term.data.aliases,
  term.data.short_def,
].join(' ').toLowerCase();
```

## Critical files

To create:
- `src/content/glossary/n.md`
- `src/content/glossary/e.md`
- `src/content/glossary/ebgm.md`
- `src/content/glossary/eram.md`
- `src/content/glossary/rr.md`
- `src/content/glossary/prr.md`
- `src/content/glossary/prr-chisq.md`
- `src/content/glossary/pt.md`
- `src/content/glossary/smq.md`
- `src/content/glossary/pt-plus-smq.md`
- `src/content/glossary/meddra.md`
- `src/content/glossary/empirica-signal.md`

To modify:
- `src/content.config.ts` — add `source` field to glossary schema
- `src/content/glossary/eb05.md` — expand body to place EB05 in the EB triplet
- `src/content/glossary/masking.md` — add `source: "original"` to frontmatter
- `src/content/glossary/mgps.md` — same
- `src/content/glossary/rgps.md` — same
- `src/content/glossary/eb-data-mining.md` — same
- `src/pages/glossary/index.astro` — filter chips + search box + client script + per-entry data attributes

## Existing patterns to reuse

- **Filter chip pattern** from `src/pages/timeline/index.astro` lines 22-49 — same chip + script structure, just one Source row instead of two.
- **`GlossaryTooltips` component** at `src/components/GlossaryTooltips.astro` — already emits `<dfn>` wrapping for any term in `glossary-aliases.json`. Adding the new entries automatically extends tooltip coverage on every page; **no change needed** to the tooltip mechanism.
- **`loadGlossary` / `loadAliases`** in `src/lib/glossary-loader.ts` — picks up the new files automatically once they exist; they feed `astro.config.mjs`'s remark plugin and the build-time `emit-shortdefs.ts` script.

## Verification

1. `npx astro sync` — schema validation passes (the new `source` field default lets existing files validate without explicit backfill, and the 5 originals are explicit).
2. `npm test` — 13 tests still pass (none of these changes touch the validator).
3. `npm run build` — 26+ pages build clean.
4. Open `/glossary/` in `npm run preview`:
   - All 40 entries render (28 existing + 12 new = 40).
   - Search box filters as you type (typing "EB" should narrow to EB05/EBGM/EB-Data-Mining).
   - Source filter chip "Original report terms" shows exactly 5 entries (Empirica Signal, EB Data Mining, Masking, MGPS, RGPS).
   - Search + filter compose (e.g., "Original report terms" + "MGP" shows just MGPS).
   - Empty-state appears when both filters miss.
5. Open `/documents/PSI-HHS-000008257443-45-attachment-49-examples-of-extreme-masking/` and hover over any column-header acronym — the tooltip shows the new `short_def` (the build-time pipeline picks up the new entries automatically via `loadAliases`).
6. Two logical commits:
   - `feat(content): glossary definitions for masking-table column headers and Empirica Signal`
   - `feat: source filter and search on /glossary/`
