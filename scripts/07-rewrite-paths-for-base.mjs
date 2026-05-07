// Post-build rewrite of root-relative paths to include the deploy base.
//
// Why: Astro's `base` config auto-prefixes URLs in routes and bundled assets,
// but does NOT touch hand-written paths in template attributes (`<a href="/timeline/">`)
// or inline scripts (`fetch('/glossary-aliases.json')`, `import('/pagefind/pagefind-ui.js')`).
// This script does that rewrite over the built dist/ tree.
//
// When deploying to a custom subdomain (where base is '/'), this script is a no-op.

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = './dist';

// Read the configured base from astro.config.mjs by lightweight string match.
// (Importing the config module is heavier and pulls in ESM/Astro deps.)
const configSrc = readFileSync('./astro.config.mjs', 'utf-8');
const baseMatch = configSrc.match(/base:\s*['"]([^'"]+)['"]/);
const BASE = baseMatch ? baseMatch[1] : '/';

if (BASE === '/') {
  console.log('[rewrite-paths] base is "/", skipping.');
  process.exit(0);
}

// BASE is like "/unmasked/". The replacement keeps the leading slash.
const baseNoTrailing = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE; // "/unmasked"

const TEXT_EXTS = new Set(['.html', '.js', '.css', '.json', '.txt', '.xml']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, out);
    } else {
      const dotIdx = entry.lastIndexOf('.');
      const ext = dotIdx >= 0 ? entry.slice(dotIdx) : '';
      if (TEXT_EXTS.has(ext)) out.push(path);
    }
  }
  return out;
}

// Negative lookahead skips already-prefixed paths, protocol-relative `//`, and
// the base path itself.
const baseAlreadyPrefix = baseNoTrailing.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// e.g. baseNoTrailing="/unmasked", baseAlreadyPrefix="unmasked"
const skipPattern = `(?!\\/|${baseAlreadyPrefix}\\/)`;

const patterns = [
  // HTML attributes that take URLs
  new RegExp(`(\\b(?:href|src|action|formaction|poster|data-pdf-path|data-href)=["'])\\/${skipPattern}`, 'g'),
  // JS dynamic imports + fetches
  new RegExp(`(\\b(?:import|fetch)\\(\\s*['"\`])\\/${skipPattern}`, 'g'),
  // CSS url(...) — catches background-image, @font-face src, etc.
  new RegExp(`(url\\(\\s*['"]?)\\/${skipPattern}`, 'g'),
];

const files = walk(DIST);
let totalRewrites = 0;
let touchedFiles = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let count = 0;
  for (const re of patterns) {
    content = content.replace(re, (_match, prefix) => {
      count++;
      return `${prefix}${BASE}`;
    });
  }
  if (count > 0) {
    writeFileSync(file, content);
    totalRewrites += count;
    touchedFiles++;
  }
}

console.log(`[rewrite-paths] rewrote ${totalRewrites} root-relative paths across ${touchedFiles} files (base=${BASE}).`);
