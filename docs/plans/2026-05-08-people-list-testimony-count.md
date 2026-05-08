# People page: include testimony in counts; fix Wiseman sort order

## Context

Last commit (`49cf049`) added a "Hearing testimony" section to witness detail pages but didn't surface the count on the People list page. Currently witnesses show "1 timeline event · 1 quote →" even when they have one or more hearing documents — under-reporting their actual record. Two follow-ups:

1. **List page** (`src/pages/people/index.astro`) — show the testimony count first in the per-actor metadata line.
2. **Detail page** (`src/pages/people/[id].astro`) — sort fix: Wiseman's main testimony currently appears AFTER his two "supporting document" entries because alphabetical sort puts `wiseman-supporting-*` before `wiseman-testimony`. Main written testimony should come first.

## Naming decision (you to confirm)

I recommend **"hearing document"** (with plural `s`) for the count label:
- 1 doc → "1 hearing document"
- 3 docs → "3 hearing documents"

Reason: covers both the written testimony itself AND any supporting research papers Wiseman filed, without misnaming the latter as "testimony." If you prefer your original phrasing ("testimony submission"), that works too — same singular/plural handling. The plan below uses "hearing document"; tell me if you'd rather the other.

## Changes

### 1. `src/pages/people/index.astro`

**Frontmatter:** load the documents collection and compute a per-actor testimony-doc count using the same filter as the detail page (any document whose `bates_id` is `<id>-testimony` or starts with `<id>-supporting-`, with `doc_type === 'testimony'`).

```ts
const documents = await getCollection('documents');
const testimonyCountFor = (id: string) =>
  documents.filter(
    (d) =>
      d.data.doc_type === 'testimony' &&
      (d.data.bates_id === `${id}-testimony` ||
        d.data.bates_id.startsWith(`${id}-supporting-`)),
  ).length;

const enriched = actors.map((a) => ({
  actor: a.data,
  eventCount: events.filter((e) => e.data.actors.includes(a.data.id)).length,
  quoteCount: quotes.filter((q) => q.data.speaker === a.data.id).length,
  testimonyCount: testimonyCountFor(a.data.id),
}));
```

**Template** — update the `<p class="counts">` line to put testimony first when present, then events, then quotes:

```astro
<p class="counts">
  <a href={`${base}people/${actor.id}/`}>
    {testimonyCount > 0 && `${testimonyCount} hearing document${testimonyCount === 1 ? '' : 's'} · `}
    {eventCount} timeline event{eventCount === 1 ? '' : 's'}
    {quoteCount > 0 && ` · ${quoteCount} quote${quoteCount === 1 ? '' : 's'}`}
    {' →'}
  </a>
</p>
```

Result on the People list (verified against the current data — Wiseman has 1 quote attributed, the other two witnesses have 0):
- Wiseman: "3 hearing documents · 1 timeline event · 1 quote →"
- Jablonowski: "1 hearing document · 1 timeline event →"
- Young: "1 hearing document · 1 timeline event →"
- All others: unchanged.

The quote count remains conditional (only shown when `> 0`), matching existing behavior.

### 2. `src/pages/people/[id].astro`

Replace the testimony sort so the main written testimony is always first:

```ts
.sort((a, b) => {
  const aMain = a.data.bates_id === `${actor.id}-testimony`;
  const bMain = b.data.bates_id === `${actor.id}-testimony`;
  if (aMain !== bMain) return aMain ? -1 : 1;
  return a.data.bates_id.localeCompare(b.data.bates_id);
});
```

This puts `<id>-testimony` at index 0; remaining `<id>-supporting-*` entries sort alphabetically among themselves (so `-1` precedes `-2`).

## Files to modify

- `src/pages/people/index.astro` — frontmatter + the `<p class="counts">` block.
- `src/pages/people/[id].astro` — single sort comparator update on the `testimonyDocs` filter.

## Verification

1. `npm run build` — should succeed unchanged.
2. Inspect built HTML:
   - `grep -o '3 hearing documents.*timeline event' dist/people/index.html` should match (Wiseman's row).
   - `grep -o '1 hearing document.*timeline event' dist/people/index.html` should match (Jablonowski + Young rows).
   - For Wiseman's detail page, the first link inside `.testimony-list` should be the main testimony: `grep -A2 'Hearing testimony' dist/people/wiseman/index.html | head -10` → first `<a>` href should be `/unmasked/documents/wiseman-testimony/`.
3. After deploy: visit `/people/` and `/people/wiseman/` to eye-check the new label and the new sort.

## Out of scope

- The People page header itself doesn't need changes; it already says "People" and the per-actor lines carry the new info.
- Quote count behavior is unchanged (still suppressed when 0).
