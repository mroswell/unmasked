import { remark } from 'remark';
import remarkGlossary from './remark-glossary.ts';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { loadAliases } from './glossary-loader.ts';

const aliases = loadAliases();

const processor = remark()
  .use(remarkGlossary, { aliases })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}
