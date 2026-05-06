import { defineConfig } from 'astro/config';
import remarkGlossary from './src/lib/remark-glossary.ts';
import { loadAliases } from './src/lib/glossary-loader.ts';
import { emitGlossaryAssets } from './src/lib/emit-shortdefs.ts';

emitGlossaryAssets();

const aliases = loadAliases();

export default defineConfig({
  site: 'https://signals.coviddocuments.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    remarkPlugins: [[remarkGlossary, { aliases }]],
  },
});
