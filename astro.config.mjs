import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.invalid',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
