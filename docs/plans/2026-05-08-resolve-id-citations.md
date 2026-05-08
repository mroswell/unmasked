# Resolve "Id." back-reference citations to their inherited source

## Context

Of the 93 citations currently rendering as "Document not publicly posted," **92** are `Id.` back-references — bare or with editorial additions ("Id.", "Id. at 3.", "Id. (emphasis added)", "Id. It is unclear …"). In legal citation, `Id.` always means *the same source as the immediately preceding citation*. Our extracted citations.json left these as orphans rather than copying the prior citation's link information forward, so the popovers under-promise the available evidence.

The remaining 1 (`fn-30`, the Walensky 2022 letter "on file with Subcomm.") is a real gap that no automated pass can fill — leave as is.

After this pass, those 92 popovers will render exactly like their prior citation does (e.g., the same "Read PDF (page N) →" deep-link), with the popover text still showing the actual `Id.`-form footnote. Readers get a working source link instead of a dead-end.

## The pass

A one-shot Node script that mutates `src/content/citations.json`:

1. Walk citations in their existing order (which mirrors the report's footnote sequence).
2. Maintain a "last source" tracker — the most recent citation in the walk that has any of `document_id`, `external_url`, or non-empty `bates_ids`.
3. For each citation whose `footnote_text` matches `^Id\.` AND that has none of those three fields, copy them from the tracker.
4. After processing, update the tracker if the citation now has a source (so a chain like `fn-21` real → `fn-22` Id. → `fn-23` Id. resolves transitively to fn-21's source).
5. Idempotent: re-running with no upstream changes makes no further edits.

The script supports `--apply`; without it, dry-run prints the count + a few examples without writing.

## Files

- **New (already drafted):** `scripts/resolve-id-citations.mjs` — the inheritance pass.
- **Modified by `--apply`:** `src/content/citations.json` — populates `document_id` / `bates_ids` / `external_url` on the affected `Id.`-form citations.

No template, component, or build-pipeline changes. The existing render priority in `src/lib/remark-citations.ts` and `src/components/Citation.astro` (document_id → bundle deep-link → external_url → unavailable) does the rest.

## Verification

1. **Dry-run first:** `node scripts/resolve-id-citations.mjs` — should report ~92 inheritances and print sample id-pairs.
2. **Apply:** `node scripts/resolve-id-citations.mjs --apply` — writes citations.json.
3. **Audit doesn't change:** the existing `node scripts/audit-citation-page-resolution.mjs` should still resolve all citations with `bates_ids` to a bundle page.
4. **Build:** `npm run build` succeeds; the docs page shows roughly the same number of "Read PDF (page N) →" + "View as text →" pairs but more total deep-links across the timeline (the inherited ones).
5. **Spot-check an Id. citation:** find one that previously said "Document not publicly posted" (e.g., fn-22, fn-83, fn-92). After apply, the popover for that footnote should show the same deep-link as the previous-numbered citation.
6. **fn-30 unchanged:** the Walensky letter still renders "Document not publicly posted" — it has its own footnote text (not "Id."-prefixed) and no source.

## Out of scope

- Tracking down fn-30 (the Walensky letter). Manual research / FOIA territory.
- Smarter inheritance for `Id. at N` (where N is a *page number* within the same source). The popover will display the `Id. at N` text and the prior citation's bates_ids; the page number isn't translated into a finer-grained PDF deep-link. That would require parsing the page hint and reconciling against the bates-page index — possible later, but adds complexity for marginal gain.
