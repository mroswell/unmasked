# Actor names with credentials displayed after the name

## Context

The People page currently shows actors with honorific prefixes ("Dr. X", "Sen. X") but no specific credential. You want the credential displayed after the name where one is documented (e.g., "Ana Szarfman, MD, PhD"), so a reader gets the actual qualification rather than a generic "Dr." Sources have been pulled from the project's own materials where available, with a few public sources for FDA / NIH / CDC leadership where in-project material didn't surface a credential.

Format conventions you confirmed:
- **Confirmed credential** → drop "Dr." prefix, append credential after a comma. Example: `Ana Szarfman, MD, PhD`.
- **Unknown credential, currently "Dr. X"** → keep `Dr. X` unchanged (conservative; most are doctoral-level officials, but I won't fabricate the specific degree).
- **Senators** → keep `Sen. X` prefix.
- **Non-academic witnesses** (Young, Carole Johnson) → bare name.

## Proposed changes

Single file: `src/content/actors.json`. **Only the `name` field changes**, per the third column below. `id`, `role_at_time`, and `short_bio` are untouched. The two right-hand columns (note + source) are for your review only and are not stored in any file.

| id | current `name` | new `name` (this is the literal value to write) | note | source |
|---|---|---|---|---|
| szarfman | Dr. Ana Szarfman | Ana Szarfman, MD, PhD | change | `psi-april-2026-part-1.txt` (signature) |
| marks | Dr. Peter Marks | Peter Marks, MD, PhD | change | Wikipedia |
| dumouchel | Dr. William DuMouchel | William DuMouchel, PhD | change | `psi-april-2026-part-1.txt` |
| menschik | Dr. David Menschik | David Menschik, MD, MPH | change | `psi-april-2026-part-1.txt` |
| baer | Dr. Bethany Baer | Dr. Bethany Baer | keep | unknown — keep "Dr." prefix |
| zinderman | Dr. Craig Zinderman | Craig Zinderman, MD, MPH | change | `psi-april-2026-part-1.txt` |
| anderson | Dr. Steven Anderson | Dr. Steven Anderson | keep | unknown |
| forshee | Dr. Richard Forshee | Dr. Richard Forshee | keep | unknown |
| niu | Dr. Manette Niu | Dr. Manette Niu | keep | unknown |
| nair | Dr. Narayan Nair | Narayan Nair, MD | change (inferred) | inferred from peers' signature pattern + role |
| cavazzoni | Dr. Patrizia Cavazzoni | Dr. Patrizia Cavazzoni | keep | unknown |
| stein | Dr. Peter Stein | Dr. Peter Stein | keep | unknown |
| stockbridge | Dr. Norman Stockbridge | Dr. Norman Stockbridge | keep | unknown |
| califf | Dr. Robert Califf | Robert Califf, MD | change | Wikipedia |
| walinsky | Sarah Walinsky | Sarah Walinsky, JD | change | `psi-april-2026-part-1.txt` |
| shimabukuro | Dr. Tom Shimabukuro | Tom Shimabukuro, MD, MPH, MBA | change | CDC author bio |
| su | Dr. John Su | John Su, MD, PhD, MPH | change | CDC author bio |
| walensky | Dr. Rochelle Walensky | Rochelle Walensky, MD, MPH | change | Harvard Kennedy School |
| reezek | Jeff Reezek | Jeff Reezek | keep | unknown |
| maro | Dr. Judy Maro | Judy Maro, PhD, MS | change | Harvard Population Medicine |
| wiseman | Dr. David Wiseman | David Wiseman, PhD, MRPharmS | change | `wiseman-testimony.txt` |
| hendrix | Brian Hendrix | Brian Hendrix | keep | unknown |
| sydnor | James Sydnor | James Sydnor | keep | unknown |
| johnson | Sen. Ron Johnson | Sen. Ron Johnson | keep | senator — prefix retained |
| collins | Dr. Francis Collins | Francis Collins, MD, PhD | change | NIH bio |
| woodcock | Dr. Janet Woodcock | Janet Woodcock, MD | change | FDA bio |
| lee | Sen. Mike Lee | Sen. Mike Lee | keep | senator — prefix retained |
| becerra | Xavier Becerra | Xavier Becerra, JD | change (inferred) | public knowledge (Harvard Law) |
| fauci | Dr. Anthony Fauci | Anthony Fauci, MD | change | NIAID bio |
| carole-johnson | Carole Johnson | Carole Johnson | keep | non-academic — bare name |
| cohen | Dr. Mandy Cohen | Mandy Cohen, MD, MPH | change | Yale Medicine |
| tabak | Dr. Lawrence Tabak | Lawrence Tabak, DDS, PhD | change | NIH bio |
| kennedy | Robert F. Kennedy, Jr. | Robert F. Kennedy, Jr., JD | change (inferred) | public knowledge |
| prasad | Dr. Vinay Prasad | Vinay Prasad, MD, MPH | change | public bio |
| jablonowski | Dr. Karl Jablonowski | Karl Jablonowski, PhD | change | `jablonowski-testimony.txt` |
| young | Maria Young | Maria Young | keep | non-academic — bare name |

## Rows to flag for your judgment

A few entries are inferential rather than directly sourced — easy to roll back individually if you'd rather not state them:

- **nair**: inferred MD from his Division Director role and the email-signature pattern of his peers. His own signed email isn't in the surfaced text.
- **becerra**: JD is public knowledge (Stanford undergrad, Harvard Law, House of Representatives) but isn't sourced in the project's materials. Conservative alternative: drop the suffix (`Xavier Becerra`).
- **kennedy**: JD from University of Virginia / Pace; public knowledge. Same caveat as Becerra.

## Implementation

Open `src/content/actors.json` and update only the `name` field for each row whose `note` column says "change" or "change (inferred)" in the table above. The exact value to write is the third column (no markdown formatting — plain string). No schema changes, no other files touched.

## Verification

1. `npm run build` — confirms the actors collection still validates against the Zod schema in `src/content.config.ts`.
2. Local: open `http://localhost:4321/unmasked/people/` and visually confirm the new names appear in the alphabetical list and on each `/people/{id}/` detail page.
3. Spot-check the home page, timeline, and quotes — none reference actor names directly (they use IDs), so no other surfaces should be affected.

## Out of scope

- Adding hearing-testimony links to the witness detail pages (Wiseman, Jablonowski, Young) — that's a separate UX enhancement we discussed earlier.
- Backfilling the 8 unknown credentials — needs additional research; conservative default keeps "Dr." until confirmed.
