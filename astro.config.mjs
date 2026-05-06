import { defineConfig } from 'astro/config';
import remarkGlossary from './src/lib/remark-glossary.ts';

const aliases = [
  { canonical: 'masking', alias: 'masking' },
  { canonical: 'masking', alias: 'masked' },
  { canonical: 'masking', alias: 'extreme masking' },
  { canonical: 'mgps', alias: 'MGPS' },
  { canonical: 'mgps', alias: 'Multi-item Gamma Poisson Shrinker' },
];

export default defineConfig({
  site: 'https://example.invalid',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    remarkPlugins: [[remarkGlossary, { aliases }]],
  },
});
