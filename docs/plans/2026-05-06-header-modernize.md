# Modernize the site header / nav

## Context

The current header (`src/layouts/BaseLayout.astro` lines 23-37, styled in `src/styles/global.css` lines 31-79) renders the seven nav links as plain underlined teal text inline with the site title and search. It reads like a 1990s newspaper navigation:

- All links use the global `a { color: var(--color-accent); }` rule → blue underlined text
- No active-page indicator (you can't tell what section you're in)
- No hover affordance beyond the default browser underline
- Site title not visually distinct from nav links (same color)
- Mobile breakpoint stacks every link vertically, ugly with 7

Goal: a clean modern feel with **no frosted/blur effects, no animations, and no underlines**. Use static contrast — solid colors, subtle background tints, weight differences — to signal hover and active states.

## Design direction: pill nav with static states

Each nav link becomes a small "pill" with rounded corners and slight horizontal padding. State changes happen via **instant background color and text color shifts** on hover/active — no transitions, no underlines, no scaling, no animations.

- **Default**: muted gray text, transparent background
- **Hover**: text goes full near-black, background gets a very light teal tint (~6% accent alpha)
- **Active page**: text goes to accent teal, background gets a slightly stronger teal tint (~10% accent alpha), font weight bumps from 500 → 600

Active state is detected via the `aria-current="page"` attribute (set by Astro at build time based on `Astro.url.pathname`). Pure CSS handles styling.

The header itself stays simple: solid `--color-bg`, sticky, single border-bottom — no box-shadow, no blur. The current site is restrained; the header should be too.

## Plan

### 1. Active-page detection in `BaseLayout.astro`

Astro's `Astro.url.pathname` reflects the current route at build time, including the deploy base prefix (`/unmasked/timeline/` on github.io subpath, `/timeline/` on local dev). Strip the base before comparing to literal hrefs.

In the frontmatter:

```ts
const base = import.meta.env.BASE_URL; // '/unmasked/' on Pages, '/' locally
const stripBase = (p: string) => (p.startsWith(base) ? '/' + p.slice(base.length) : p);
const route = stripBase(Astro.url.pathname);
const isActive = (href: string) =>
  href === '/' ? route === '/' : route === href || route.startsWith(href);
```

Replace the seven hard-coded nav `<a>` lines with a small loop:

```astro
{[
  { href: '/explainer/', label: 'Explainer' },
  { href: '/timeline/', label: 'Timeline' },
  { href: '/documents/', label: 'Documents' },
  { href: '/quotes/', label: 'Quotes' },
  { href: '/people/', label: 'People' },
  { href: '/glossary/', label: 'Glossary' },
  { href: '/about/', label: 'About' },
].map(({ href, label }) => (
  <a href={href} aria-current={isActive(href) ? 'page' : undefined}>{label}</a>
))}
```

`startsWith` makes `/people/` active when on `/people/szarfman/` too — sub-pages highlight their parent.

### 2. Restyle in `global.css` — pill nav, no animations

Replace lines 31-79 with this. **No `transition` properties anywhere; no `transform`; no `backdrop-filter`; no underlines.**

```css
.site-header,
.site-footer {
  font-family: var(--font-sans);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.7rem 1.5rem;
  background: var(--color-bg);
}

.site-footer {
  border-top: 1px solid var(--color-border);
  border-bottom: none;
  font-size: 0.9rem;
  color: var(--color-muted);
}

.site-title {
  font-weight: 700;
  font-size: 1.2rem;
  letter-spacing: -0.01em;
  color: var(--color-text);
  text-decoration: none;
}

.site-header nav {
  display: flex;
  gap: 0.25rem;
  flex: 1;
  margin-left: 1rem;
}

.site-header nav a {
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  white-space: nowrap;
}

/* Hover: subtle teal background tint, text fills in */
.site-header nav a:hover {
  color: var(--color-text);
  background: rgba(15, 76, 92, 0.06);
}

/* Active page: stronger tint, accent text color, bolder weight */
.site-header nav a[aria-current="page"] {
  color: var(--color-accent);
  background: rgba(15, 76, 92, 0.10);
  font-weight: 600;
}

.search-mount {
  min-width: 12rem;
}

@media (max-width: 860px) {
  .site-header {
    padding: 0.6rem 1rem;
    gap: 0.5rem;
  }
  .site-header nav {
    order: 3;
    width: 100%;
    margin-left: 0;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 0.25rem;
    /* hide scrollbar but keep functionality */
    scrollbar-width: none;
  }
  .site-header nav::-webkit-scrollbar { display: none; }
  .search-mount { margin-left: auto; }
}
```

Notes:

- The `rgba(15, 76, 92, 0.06)` and `0.10)` literals are the accent color (`#0f4c5c`) at low alphas — light enough to feel like a tint, not a button.
- No `transition` declarations means hover and active styles snap on/off instantly. This is what gives it the static, restrained feel you described.
- Site title gets a clear visual hierarchy: solid near-black, slightly larger, no underline. It's a wordmark, not a link in the same way nav links are.
- Mobile pattern: nav becomes a horizontally-scrollable row below the title and search rather than wrapping or stacking each link.

The global `a { color: var(--color-accent); }` rule (line 29) still applies elsewhere on the site; the nav-specific selectors override it within `.site-header nav`.

## Critical files

- `src/layouts/BaseLayout.astro` — add active-page helper to frontmatter; replace the seven hard-coded nav links with a `.map()` that adds `aria-current="page"` (lines 23-37)
- `src/styles/global.css` — replace lines 31-79 with the rules above

## Existing patterns to reuse

- The `:root` CSS variables (lines 1-11): `--color-text`, `--color-bg`, `--color-accent` (`#0f4c5c`), `--color-muted`, `--color-border`, `--font-sans`. The literal `rgba(15, 76, 92, ...)` values are the accent color spelled out for alpha control — slightly redundant but works without extra variables.
- The base-stripping pattern matches what `scripts/07-rewrite-paths-for-base.mjs` already does for the github.io subpath deploy.
- `aria-current="page"` is the WAI-ARIA standard for active nav links — semantic + styleable.

## Verification

1. `rm -rf dist .astro && npm run build` — should still produce 61 pages cleanly.
2. `grep -c 'aria-current="page"' dist/index.html` → expect 0 (home isn't in nav)
3. `grep -c 'aria-current="page"' dist/timeline/index.html` → expect 1
4. `grep -c 'aria-current="page"' dist/people/szarfman/index.html` → expect 1 (People link, via startsWith match)
5. `npm run preview` and visit each top-level page:
   - Active link has the accent text color + light teal background tint
   - Hover any other link → text shifts to near-black + slight teal tint background, instantly (no fade)
   - Site title is solid black, not teal, no underline
   - No frosted/blurred effect on the header
   - No animations anywhere on hover or page change
   - Mobile (resize to <860px): nav becomes a horizontal scroll strip below the title row
6. Commit + push to redeploy.
