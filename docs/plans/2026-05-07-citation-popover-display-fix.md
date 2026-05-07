# Fix citation popovers showing all-at-once on Timeline

## Context

Commit `e5c2545` ("feat: render [^fn-N] footnote markers as popovers") moved citation popover styles from the scoped `<style>` block in `Citation.astro` into `src/styles/global.css` so the same classes apply to popovers emitted by the `remark-citations` remark plugin inside markdown bodies. In doing so, the `.cite-popover` rule ended up with `display: block` at the top level — which defeats the browser's mechanism for hiding a closed `[popover]` element.

The HTML popover UA stylesheet has roughly this shape:

```css
[popover] {
  position: fixed;
  inset: 0;
  width: fit-content;
  height: fit-content;
  margin: auto;          /* → centered in viewport */
}
[popover]:not(:popover-open) { display: none; }   /* hides when closed */
```

The `position: fixed; inset: 0; margin: auto` block applies to **every** `[popover]` element regardless of open state. The element is hidden purely by `display: none` when closed. My `.cite-popover { display: block; ... }` overrides that hide-when-closed rule, so **every** popover on the page is rendered as a fixed, viewport-centered modal box, stacked on top of every other popover at the same center point. The browser's `position: fixed` removes them from normal flow, so the body content of the timeline events is also visible behind/around the stack — but the cumulative box-shadow + white backgrounds of dozens of overlapping popovers at center cover most of it visually.

This produces both reported symptoms on `/timeline/`:

1. **"All the popups are popping up at the same time."** Every popover is rendered as a centered modal box from page load. The dark blob in the screenshot is many popover backgrounds + box-shadows accumulating in the viewport center.
2. **"When I click a footnote, the whole blurb disappears."** Clicking a marker button doesn't actually change much visually — every popover was already shown stacked-centered. The user perceives it as the timeline event body content vanishing because the body text was always behind the centered popover stack; interaction draws attention to it.

Both symptoms collapse to one root cause: `display: block` on `.cite-popover` defeats the UA's `[popover]:not(:popover-open) { display: none }` rule.

## Fix

Single change in `src/styles/global.css` (the `.cite-popover` selector around lines 219–232):

- **Remove** the `display: block;` declaration from `.cite-popover`.
- All the remaining declarations on `.cite-popover` (max-width, padding, border, background, border-radius, box-shadow, font-family, font-size, line-height) are visual styling that's safe to apply unconditionally — they only have any visible effect when the browser puts the element in the top-layer via `:popover-open`.

The browser's UA stylesheet handles the rest:
- `[popover]:not(:popover-open)` → `display: none`
- `[popover]:popover-open` → `display: block` + top-layer + centered via `position: fixed; inset: 0; margin: auto`.

No JS or markup changes required. The `<span popover="auto">` element emitted by `remark-citations` and the `<div popover="auto">` from `Citation.astro` both work correctly once the override is removed.

## File to change

- `src/styles/global.css` — delete `display: block;` from the `.cite-popover` rule.

## Verification

1. `bun run dev` (or `bun run build && bun run preview`) and visit `/timeline/`.
2. **Before any click**:
   - No popover boxes should be visible anywhere on the page — neither stacked at viewport center nor inline in body text.
   - Each timeline event should show its full body text and the `Citations: [N]` footer with small `[N]` marker buttons.
3. **Click a `[N]` button**:
   - The clicked popover opens, centered in the viewport (modal-style — the UA default for `[popover]`).
   - The body text remains in place behind it.
4. **Click outside the popover or press Esc**: the popover closes and the page returns to the no-popover-visible state from step 2.
5. **Click a different `[N]`**: the previous popover closes (auto light-dismiss), only the new one is visible.
6. **Open DevTools, inspect any `<span class="cite-popover">` while closed**: computed `display` should be `none` (from the UA `[popover]:not(:popover-open)` rule). When open, computed `display` should be `block`.
7. Smoke-check `/people/`, the explainer pages, and any document detail page that uses citations — same behavior.
8. Glossary `<dfn>` tooltips should still work (they use `::after` content, not the popover API, and are independent).

## Out of scope

- Any redesign of the popover positioning (anchor positioning to the trigger button) — current centered-modal behavior is what the UA gives us for free and is acceptable.
- Any changes to `remark-citations.ts` or `Citation.astro` — markup is fine.
