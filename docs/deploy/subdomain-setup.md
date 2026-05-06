# Setting up `signals.coviddocuments.com` on GitHub Pages

This guide walks through publishing the site as a subdomain of `coviddocuments.com`. It assumes:

- You own `coviddocuments.com` and can edit DNS records at your registrar.
- The main `coviddocuments.com` site is already on GitHub Pages in a separate repo.
- You have the GitHub CLI (`gh`) installed and authenticated, OR you'll use the GitHub web UI.

The chosen URL is **`signals.coviddocuments.com`**.

There are two viable layouts. Pick one before you start.

---

## Layout A — separate repo with its own subdomain (recommended)

Each property is its own repo. `coviddocuments.com` stays in its existing repo; this site lives at `signals.coviddocuments.com` in a new repo. Clean separation, easy to migrate later.

### A.1 Create the GitHub repo

```bash
cd /Users/marjorieroswell/Projects/vaccines/safety-signal-masking

# Option 1 — use the GitHub CLI (creates the repo and pushes in one go):
gh repo create signals-coviddocuments --public --source=. --push

# Option 2 — create on github.com first, then push:
git remote add origin git@github.com:<your-username>/signals-coviddocuments.git
git push -u origin main
git push origin --tags    # pushes the m0-skeleton tag
```

Naming: `signals-coviddocuments` is just a suggestion — pick whatever repo name you like. The repo name does NOT have to match the subdomain.

### A.2 Add a CNAME file

GitHub Pages reads a file literally named `CNAME` (no extension) at the repo root to know what custom domain to serve. The Astro `public/` directory gets copied to `dist/` at build time, so put it there:

```bash
echo "signals.coviddocuments.com" > public/CNAME
git add public/CNAME
git commit -m "chore: add CNAME for signals.coviddocuments.com"
git push
```

### A.3 Configure DNS at your registrar

In whatever DNS panel you use for `coviddocuments.com`, add this CNAME record:

| Type  | Name (host) | Value                       | TTL    |
|-------|-------------|-----------------------------|--------|
| CNAME | `signals`   | `<your-github-username>.github.io` | 3600   |

That's it — one record. The "Name" field is just `signals` (the registrar prepends the domain). The "Value" is your GitHub Pages account host, e.g. `mroswell.github.io` (note: NOT the repo URL — just the user/org subdomain on `github.io`).

DNS propagation usually takes 5-30 minutes. You can spot-check it with:

```bash
dig signals.coviddocuments.com +short
# Expected: <your-github-username>.github.io  → some IP
```

### A.4 Enable Pages in the repo

In the GitHub web UI:

1. Open the repo's **Settings → Pages**.
2. Under "Source," select **GitHub Actions**. (Don't pick "Deploy from branch" — the workflow file we already committed handles this.)
3. Under "Custom domain," enter `signals.coviddocuments.com` and click **Save**.
4. After DNS propagates, GitHub will provision an HTTPS certificate (Let's Encrypt) automatically — this can take a few minutes. Once it's ready, check **Enforce HTTPS**.

You can also do step 3 via the API if you prefer:

```bash
gh api -X PUT repos/<your-username>/signals-coviddocuments/pages \
  -f cname='signals.coviddocuments.com' \
  -F https_enforced=true
```

### A.5 Trigger the deploy

The workflow at `.github/workflows/deploy.yml` already runs on push to `main`. The first push to `main` after Pages is enabled will run it. To force a manual run:

```bash
gh workflow run deploy.yml
```

Watch progress:

```bash
gh run watch
```

When the deploy job succeeds, visit `https://signals.coviddocuments.com/`.

### A.6 Verify

- Open `https://signals.coviddocuments.com/` — should show the home page with the three mode cards.
- Click into `/timeline/`, `/documents/`, etc. — all routes work.
- The footer disclaimer should read "This site is not affiliated with the Subcommittee."
- Try `https://signals.coviddocuments.com/timeline/#2021-03-26` — should auto-expand the placeholder event.

---

## Layout B — subdirectory of the existing `coviddocuments.com` repo

Use this if you'd rather not spin up a new repo. The site lives at `coviddocuments.com/signals/` inside the existing `coviddocuments.com` repo.

This requires `base: '/signals/'` in `astro.config.mjs` so all built links are prefixed correctly. **Don't change `base` until you actually adopt this layout** — keeping `base: '/'` is correct for both standalone development AND for Layout A.

### B.1 Add `base: '/signals/'` to astro.config.mjs

```javascript
export default defineConfig({
  site: 'https://coviddocuments.com',
  base: '/signals/',           // ← add
  // ... rest unchanged
});
```

### B.2 Build and copy the output

```bash
npm run build
```

Then in your `coviddocuments.com` repo, copy the contents of this project's `dist/` directory into `<coviddocuments.com-repo>/signals/`. Commit and push that repo as you normally would; its existing GitHub Pages deploy picks up the new directory.

### B.3 Verify

`https://coviddocuments.com/signals/` should show the home page. All internal links will be prefixed with `/signals/`.

**Tradeoff:** every content update requires a build-and-copy step (or a script) plus committing to two repos. For a project this size, Layout A is much cleaner.

---

## After deploy: small follow-ups

- **Update the `site` field in `astro.config.mjs`** from the placeholder `https://example.invalid` to `https://signals.coviddocuments.com`. This is what Pagefind and any future canonical-URL logic uses. Commit, push, the workflow re-runs.
- Consider adding `https://signals.coviddocuments.com` as a "Website" link on the GitHub repo's About panel.
- Once the site is live, you can mention it on COVIDDocuments.com itself — e.g., link from the homepage to the new sub-site.

## Troubleshooting

**`signals.coviddocuments.com` returns 404 after DNS propagates.**
GitHub needs the CNAME file in the deployed site to recognize the custom domain. Verify `https://signals.coviddocuments.com/CNAME` returns the string `signals.coviddocuments.com`. If not, the CNAME file isn't in `public/` or hasn't been built into `dist/`.

**HTTPS certificate not provisioning.**
GitHub's automatic Let's Encrypt provisioning can take up to 24 hours after DNS first resolves correctly. If it's still pending after a day, in the Pages settings remove the custom domain, save, re-add it, save again — this re-triggers the certificate request.

**DNS resolves but the site shows a different repo's content.**
Two GitHub Pages sites can't share the same custom domain. If `coviddocuments.com` is already a custom domain on a Pages site somewhere, double-check that the CNAME is set to `<username>.github.io`, NOT to a different repo's Pages URL.

**Pages workflow fails on `npm test`.**
The CI runs `npm test` before building. If you've added new tests or new content that fails cross-reference validation, the build halts. Run `npm test && npm run build` locally before pushing.
