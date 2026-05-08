# Make "Search inside documents" the default mode on /documents/

## Context

The Documents archive page has two modes: **Filter list** (only matches metadata — Bates ID, title, doc_type, format) and **Search inside documents** (full-text via Pagefind across every document detail page). The full-text mode is the more valuable one for an evidence archive, but it's currently hidden behind a chip the user didn't notice. The two button labels also feel asymmetric ("Search inside documents" vs. "Filter list" — different verbs).

This change makes content search the default, swaps the chip order, renames the metadata-search chip for symmetry, and gives it a more descriptive placeholder.

## Changes — single file: `src/pages/documents/index.astro`

### 1. Swap chip order and default

In the markup (the `.filter-row` containing the mode buttons), move "Search inside documents" first and "Search list" second. Move the initial `is-active` class to the first chip.

```astro
<button class="filter-chip is-active" data-mode="content" type="button">Search inside documents</button>
<button class="filter-chip" data-mode="filter" type="button">Search list</button>
```

### 2. Default state

In the `<script>` block, change the initial mode:

```ts
const state: { ft: string; q: string; mode: Mode } = { ft: 'all', q: '', mode: 'content' };
```

### 3. Update placeholders

The two mode placeholder constants (added in commit `e4445eb`) become:

```ts
const FILTER_PLACEHOLDER = 'Search by Bates ID or Title (e.g. testimony, 0008257)…';
const CONTENT_PLACEHOLDER = 'Search full text of all document pages (e.g. masking, ECMO, RGPS)…';
```

(Note: the user wrote `0009257` in chat — corrected to `0008257` here because it actually matches Bates IDs in the corpus, e.g. `PSI-HHS-000008257443-45-49-examples`. Easy to revert if you'd rather keep the literal value you wrote.)

### 4. Initial DOM-rendered placeholder

The static `placeholder` attribute on `<input id="document-search">` currently reads "Search documents (e.g. testimony, masking, 0008257)…". With content as default, change it to the new content placeholder so the first paint matches the active mode (the JS will keep it correct on subsequent toggles):

```astro
placeholder="Search full text of all document pages (e.g. masking, ECMO, RGPS)…"
```

### 5. Suppress dev-mode auto-focus surprise

The current code calls `searchInput.focus()` when entering content mode. With content as the default, that focus happens on every initial page load — which can yank scroll position on slow loads and is sometimes undesirable. Two reasonable choices:

- **Recommended:** only focus on user-initiated mode change, not on initial load. Track this by skipping `focus()` during the first synchronous `applyMode()` call and only calling it from the chip click handler going forward.
- Alternative: leave the auto-focus in `applyMode()` and accept the focus on initial load.

Implementation for the recommended path: move the `focus()` + `select()` lines out of `applyMode()` and into the chip click handler that toggles to content mode.

## Files to modify

- `src/pages/documents/index.astro` — markup of the two mode chips, the static input placeholder, the initial `state.mode`, the `FILTER_PLACEHOLDER` value, and the focus-management refactor (item 5).

No other files.

## Verification

1. `npm run build` — confirm the build completes and the docs page exists at `dist/documents/index.html`.
2. Inspect the built HTML: `grep 'is-active.*data-mode' dist/documents/index.html` — should show `data-mode="content"` as the active chip.
3. `npm run dev` and visit `http://localhost:4321/unmasked/documents/`:
   - First chip is **Search inside documents** (highlighted), second is **Search list**.
   - Input placeholder reads the content one.
   - Status line below reads "Type to search inside document text…" (the dev environment will show "Search index not yet built" once you actually type, since Pagefind doesn't run in dev — that's expected).
   - Click **Search list** — placeholder updates to the Bates/title one; the table reappears; typing filters the table by metadata.
   - Click **Search inside documents** — input is focused + selected, placeholder swaps back, table hides.
4. After deploy, confirm on `https://mroswell.github.io/unmasked/documents/`:
   - Default lands on content mode.
   - Typing "masking" yields excerpts from the bundled PDFs.
   - Typing "wiseman" or "0008257" in **Search list** mode filters the table.

## Out of scope

- Combining the two modes into one (e.g., showing filtered list + top content matches simultaneously). Worth considering later, but adds UI complexity.
- Reworking the dev-mode "Search index not yet built" message — it's accurate; the actual fix is using `npm run build && npm run preview` with a base-aware static server, which is its own thread.
