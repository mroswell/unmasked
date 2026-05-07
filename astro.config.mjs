import { defineConfig } from 'astro/config';
import remarkGlossary from './src/lib/remark-glossary.ts';
import { loadAliases } from './src/lib/glossary-loader.ts';
import { emitGlossaryAssets } from './src/lib/emit-shortdefs.ts';

emitGlossaryAssets();

const aliases = loadAliases();

export default defineConfig({
  // Deployed at GitHub Pages subpath: https://mroswell.github.io/unmasked/
  // When migrating to a custom subdomain, change site → 'https://signals.coviddocuments.com',
  // base → '/', and remove the rewrite-paths build step.
  site: 'https://mroswell.github.io',
  base: '/unmasked/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    remarkPlugins: [[remarkGlossary, { aliases }]],
  },
});
