# Migration checklist: GitHub Pages subpath → unmasked.coviddocuments.com

> **Do not run this on a demo day.** The whole thing typically takes 30–60 minutes (mostly waiting for DNS and TLS), but allow a 24-hour buffer for unforeseen DNS propagation. If anything goes wrong mid-flight, the rollback at the bottom is two reverts away.

## Context

The site currently lives at `https://mroswell.github.io/unmasked/`. Migrating to a custom subdomain `unmasked.coviddocuments.com` (chosen because the site IS branded "Unmasked" and the hearing was titled "Unmasked: …"). The github.io URL keeps working: GitHub Pages auto-redirects to the custom domain after migration, with path preservation (the `/unmasked/` repo prefix is dropped from the redirected URL, so `mroswell.github.io/unmasked/timeline/` → `unmasked.coviddocuments.com/timeline/`).

## Pre-flight (~5 min, no production impact)

- [ ] **Confirm DNS access.** Log into wherever coviddocuments.com is currently managed (registrar dashboard or a separate DNS provider like Cloudflare). You need a panel where you can add a CNAME record for the `unmasked` subdomain. If you don't know which panel, check email for prior coviddocuments.com receipts.
- [ ] **Lock in the hostname.** Final answer: `unmasked.coviddocuments.com`. (If you change your mind later, that is its own migration; don't rename mid-flight.)
- [ ] **Pick a low-traffic time window.** A weekend morning is ideal — no one is likely to be loading the site if anything is briefly broken.

## Repo changes (~10 min)

Make these as one commit on a feature branch, then merge to `main` only when DNS is ready (step 3 below).

- [ ] **Create `public/CNAME`** containing exactly one line: `unmasked.coviddocuments.com` (no `https://`, no trailing slash, no newline before EOF other than the implicit one).
- [ ] **Edit `astro.config.mjs`:**
  - `site: 'https://unmasked.coviddocuments.com'`
  - `base: '/'`
- [ ] **Leave `scripts/07-rewrite-paths-for-base.mjs` alone.** It already has an early-exit when `base === '/'` (line 21), so it becomes a no-op without further changes. Optional later cleanup; not required for the migration.
- [ ] **Sanity-check `npm run build` locally** before pushing. Look for `[rewrite-paths] base is "/", skipping.` in the output and confirm `dist/index.html` has hrefs like `href="/timeline/"` (no `/unmasked/` prefix).
- [ ] **Don't push yet.** Hold these changes on a feature branch until DNS is in place — pushing them to `main` first would briefly make the live site request resources at root paths that don't exist yet.

## DNS changes (~5 min, then 5–60 min wait for propagation)

In your DNS panel for coviddocuments.com:

- [ ] **Add a CNAME record:**
  - Name / Host: `unmasked`
  - Type: `CNAME`
  - Value / Target: `mroswell.github.io.` (note the trailing dot if your panel uses it)
  - TTL: 300 or whatever the panel default is — doesn't matter much for a one-time setup
- [ ] **If your DNS provider is Cloudflare**, set the proxy status of this record to **DNS only (gray cloud)**, not "Proxied (orange cloud)." GitHub Pages handles its own TLS; double-proxying causes cert issues.
- [ ] **Verify DNS propagation from your local machine** (don't proceed until this works):
  ```
  dig unmasked.coviddocuments.com CNAME +short
  ```
  Should return `mroswell.github.io.` Repeat until it does — usually 5 minutes, sometimes up to an hour.

## Push the repo changes and configure GitHub Pages (~10 min, then 5–30 min wait for TLS)

- [ ] **Push the feature branch and merge to main** (or push directly to main — your call). The CNAME file in `public/` ends up at the root of the deployed site, which is what GitHub Pages reads.
- [ ] **Wait for the GitHub Actions deploy** to complete (~2 min — same as a normal push).
- [ ] In GitHub: **Repo → Settings → Pages**:
  - The "Custom domain" field should now show `unmasked.coviddocuments.com` (auto-populated from the CNAME file). If not, type it and click Save.
  - GitHub runs DNS verification — wait for the green check.
  - **Wait** for "Your site is published at https://unmasked.coviddocuments.com" with a TLS lock icon. Cert provisioning takes 5–30 min, occasionally longer.
- [ ] Once the cert is ready, **tick "Enforce HTTPS"** (checkbox below the custom domain field).

## Verification (~10 min)

Run these in order; do not skip any:

- [ ] **HTTP status checks:**
  ```
  for url in https://unmasked.coviddocuments.com/ \
             https://unmasked.coviddocuments.com/timeline/ \
             https://unmasked.coviddocuments.com/documents/ \
             https://unmasked.coviddocuments.com/documents/psi-april-2026-part-2/ \
             https://unmasked.coviddocuments.com/people/wiseman/; do
    printf '%s -> ' "$url"; curl -sI "$url" | head -1
  done
  ```
  All should return `200 OK`.
- [ ] **Visual smoke test in browser:**
  - Home page renders with styling, nav links work
  - Timeline shows events; click any `[N]` footnote → popover shows two links, "Read PDF (page N) →" opens the bundled PDF at the right page
  - Documents page lands on "Search inside documents" mode and shows the catalog table
  - Type "masking" → search results appear, click one → lands on document detail
  - Glossary tooltip appears on a `<dfn>` term hover
- [ ] **Legacy URL redirect:** visit `https://mroswell.github.io/unmasked/` → should redirect to `https://unmasked.coviddocuments.com/`. Then try a deep link like `https://mroswell.github.io/unmasked/timeline/` — should redirect to `https://unmasked.coviddocuments.com/timeline/`.
  - **If deep links DON'T strip the `/unmasked/` prefix correctly** (some reports of GitHub Pages preserving the full path), add a custom 404 handler. Ping me; it's a 20-line addition (`src/pages/404.astro` with a tiny JS that detects `/unmasked/<rest>` and redirects to `/<rest>`).
- [ ] **No mixed-content warnings** in DevTools console on any page.

## Post-migration

- [ ] **Email anyone you've shared the github.io URL with** (Senate staff, journalists) to let them know the canonical URL is now `unmasked.coviddocuments.com`. The github.io URL still works via redirect, but the new URL is what should be quoted in any new communication.
- [ ] **Update README** (if present) and any sticky notes / docs that quote the github.io URL.
- [ ] **Leave the github.io redirect in place indefinitely.** It costs nothing and protects against bookmark rot.

## Rollback (in case something goes badly)

If after migration the site is broken on the custom domain and the github.io redirect makes that worse:

1. **Repo → Settings → Pages**, clear the "Custom domain" field, click Save.
2. **Revert the migration commit:** `git revert <sha> && git push`. This restores `astro.config.mjs` (`base` back to `/unmasked/`) and removes `public/CNAME`.
3. After ~2 minutes the next deploy runs, and `https://mroswell.github.io/unmasked/` is the live site again.
4. The DNS CNAME record for `unmasked.coviddocuments.com` becomes harmless (it points at github.io but no GitHub Pages site is configured for that hostname); you can leave it or remove it.

Total rollback time: ~5 minutes from first sign of trouble.

## What stays the same after migration

- All page URLs (the `base` change just removes the `/unmasked/` prefix; `/timeline/`, `/documents/`, etc. continue to work)
- All citation deep-links and `#doc-page-N` URL hash routing
- The Pagefind search index (rebuilt from scratch on the next deploy; no migration needed)
- Glossary tooltips (all paths in `GlossaryTooltips.astro` use `import.meta.env.BASE_URL`, which transparently becomes `/`)
- The post-build path rewriter (no-ops when base is `/`)

Nothing in the codebase needs to change beyond the two-line config edit and the CNAME file.
