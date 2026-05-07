import { remark } from 'remark';
import remarkGlossary from './remark-glossary.ts';
import remarkCitations from './remark-citations.ts';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { loadAliases } from './glossary-loader.ts';
import { readFileSync } from 'node:fs';

const aliases = loadAliases();

// Load citations once at module load. Build-time only; the file is small
// enough (~100KB) and doesn't change during a build.
const citations = JSON.parse(readFileSync('./src/content/citations.json', 'utf-8'));

const base = import.meta.env.BASE_URL;

const processor = remark()
  .use(remarkGlossary, { aliases })
  .use(remarkCitations, { citations, base })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}
