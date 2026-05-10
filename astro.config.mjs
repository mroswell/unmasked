import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGlossary from './src/lib/remark-glossary.ts';
import { loadAliases } from './src/lib/glossary-loader.ts';
import { emitGlossaryAssets } from './src/lib/emit-shortdefs.ts';

emitGlossaryAssets();

const aliases = loadAliases();

export default defineConfig({
  integrations: [sitemap()],
  // Deployed at https://vsafetysignals.com (custom apex domain on GitHub Pages,
  // configured via public/CNAME). The legacy github.io URL still works via
  // GitHub Pages' automatic redirect.
  // The post-build path-rewriter (scripts/07-rewrite-paths-for-base.mjs) is a
  // no-op when base is '/'.
  site: 'https://vsafetysignals.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Preserve any deep-links that pointed at the old, misspelled slug
  // /people/reezek/ — the actor's correct surname is Reczek, and the
  // slug was renamed to match. Astro emits a meta-refresh redirect at
  // the old path on static deploys.
  redirects: {
    '/people/reezek/': '/people/reczek/',
  },
  markdown: {
    remarkPlugins: [[remarkGlossary, { aliases }]],
  },
});
