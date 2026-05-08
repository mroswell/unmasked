# Going live on vsafetysignals.com — GoDaddy DNS + GitHub Pages playbook

> **Supersedes** `2026-05-07-custom-domain-migration-checklist.md`. That earlier draft assumed a subdomain (unmasked.coviddocuments.com) and a CNAME-only DNS setup; this one is for the chosen apex domain `vsafetysignals.com` registered at GoDaddy, which requires A records.

## Context

The site currently lives at `https://mroswell.github.io/unmasked/`. Migrating to the apex domain `vsafetysignals.com`. Total wall-clock ~30–60 min, mostly waiting for DNS propagation and TLS cert provisioning. The github.io URL keeps working: GitHub Pages auto-redirects to the custom domain after migration with path preservation.

## Step 1 — GoDaddy DNS (~5 min, then 5–60 min wait for propagation)

1. **Log in → My Products → vsafetysignals.com → DNS / Manage DNS.**
2. **Note (or delete) the existing default A record at `@`** — it's GoDaddy's parking page. You'll replace it.
3. **Add 4 A records**, all with **Name: `@`**, **Type: A**:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
   (These are GitHub Pages' anycast IPs; all four are required.) TTL 600 is fine.
4. **Optional — add `www` redirect.** Add a CNAME: **Name `www`**, **Type CNAME**, **Value `mroswell.github.io.`** (trailing dot if GoDaddy shows one). Lets `www.vsafetysignals.com` work.
5. **Verify propagation** before continuing:
   ```
   dig vsafetysignals.com +short
   ```
   Should return all four `185.199.108.153`-style IPs. Repeat every minute or two until it does.

## Step 2 — Repo changes (~2 min)

Three small changes, can be one commit:

- **Create `public/CNAME`** with one line: `vsafetysignals.com` (no `https://`, no slash).
- **Edit `astro.config.mjs`**:
  - `site: 'https://vsafetysignals.com'`
  - `base: '/'`
- **Push to main.**

The post-build path-rewriter (`scripts/07-rewrite-paths-for-base.mjs`) already early-exits when `base === '/'`, so it becomes a no-op without further changes.

(Claude can do this part for you — say the word once DNS is propagating.)

## Step 3 — GitHub Pages settings (~10 min, then 5–30 min for TLS)

1. **Repo → Settings → Pages.**
2. **Custom domain field** should auto-populate `vsafetysignals.com` from the CNAME file. If not, type it and Save.
3. Wait for the green "DNS check successful" indicator. (Failure here means DNS hasn't propagated yet — wait and retry.)
4. Wait for "Your site is published at https://vsafetysignals.com" with a TLS lock icon. **Cert provisioning takes 5–30 min**, sometimes longer.
5. Once the lock appears, **tick "Enforce HTTPS"**.

## Step 4 — Verify (~5 min)

```
curl -I https://vsafetysignals.com/
curl -I https://www.vsafetysignals.com/
curl -I https://mroswell.github.io/unmasked/
```

- The first two should return `200 OK`.
- The third should return `301` redirecting to `https://vsafetysignals.com/` — GitHub's free legacy-URL preservation.

Browser smoke test: `vsafetysignals.com/timeline/` loads, click a footnote, click "Read PDF (page N) →" — the deep-link should resolve correctly. Citation `import.meta.env.BASE_URL` collapses from `/unmasked/` to `/` automatically.

## Rollback (if anything goes badly)

1. **Repo → Settings → Pages → clear the Custom domain field**, Save.
2. **`git revert <migration-sha> && git push`** — restores `astro.config.mjs` to `base: '/unmasked/'` and removes `public/CNAME`.
3. After ~2 min the next deploy runs and `https://mroswell.github.io/unmasked/` is live again.
4. The dangling DNS A records at GoDaddy are harmless without the GitHub Pages custom-domain config; leave them or remove them.

Total rollback: ~5 minutes from first sign of trouble.

## What stays the same after migration

- All page URLs (the `base` change just removes `/unmasked/`; `/timeline/`, `/documents/`, `/people/`, etc. continue to work)
- Citation deep-links and `#doc-page-N` URL hash routing
- Pagefind search index (rebuilt automatically on the next deploy)
- Glossary tooltips (paths use `import.meta.env.BASE_URL`, transparently becomes `/`)

Nothing in the codebase needs to change beyond the two-line config edit and the CNAME file.

## Post-migration

- Email anyone who has the github.io URL with the new canonical URL. The github.io URL still works via redirect, but new comms should quote the new one.
- Update README and any sticky-note references that quote the github.io URL.
- Leave the github.io redirect in place indefinitely. Costs nothing.
