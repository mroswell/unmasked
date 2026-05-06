import type { Plugin } from 'unified';
import type { Root, Text, Parent, RootContent } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';

interface AliasEntry {
  canonical: string;
  alias: string;
}

interface Options {
  aliases: AliasEntry[];
}

const remarkGlossary: Plugin<[Options], Root> = (options) => {
  const aliases = options.aliases;

  return (tree) => {
    const wrappedCanonicals = new Set<string>();

    visit(tree, 'text', (node: Text, index, parent: Parent | undefined) => {
      if (!parent || index === undefined) return;
      if (parent.type === 'inlineCode' || parent.type === 'code') return;
      if (isInsideNoGlossSpan(parent, index)) return;

      const replacements: RootContent[] = [];
      let value = node.value;
      let hadReplacement = false;

      while (true) {
        let best: { canonical: string; alias: string; index: number; matched: string } | null = null;
        for (const { canonical, alias } of aliases) {
          if (wrappedCanonicals.has(canonical)) continue;
          const re = new RegExp(`\\b(${escapeRegex(alias)})\\b`, 'i');
          const m = value.match(re);
          if (!m || m.index === undefined) continue;
          if (!best || m.index < best.index || (m.index === best.index && alias.length > best.alias.length)) {
            best = { canonical, alias, index: m.index, matched: m[0] };
          }
        }
        if (!best) break;

        const before = value.slice(0, best.index);
        const after = value.slice(best.index + best.matched.length);
        if (before) replacements.push({ type: 'text', value: before } as Text);
        replacements.push({
          type: 'html',
          value: `<dfn data-term="${escapeAttr(best.canonical)}">${escapeHtml(best.matched)}</dfn>`,
        } as RootContent);
        value = after;
        wrappedCanonicals.add(best.canonical);
        hadReplacement = true;
      }

      if (!hadReplacement) return;
      if (value) replacements.push({ type: 'text', value } as Text);
      parent.children.splice(index, 1, ...replacements);
      return [SKIP, index + replacements.length];
    });

  };
};

/**
 * Returns true if the text node at `parent.children[index]` lies between
 * an opening `<span data-no-gloss ...>` html sibling and its closing `</span>`
 * html sibling within the same parent.
 */
function isInsideNoGlossSpan(parent: Parent, index: number): boolean {
  let depth = 0;
  for (let i = 0; i < index; i++) {
    const sib = parent.children[i] as { type: string; value?: string };
    if (sib.type !== 'html' || typeof sib.value !== 'string') continue;
    const openMatches = sib.value.match(/<span\b[^>]*\bdata-no-gloss\b[^>]*>/gi);
    const closeMatches = sib.value.match(/<\/span>/gi);
    if (openMatches) depth += openMatches.length;
    if (closeMatches) depth -= closeMatches.length;
    if (depth < 0) depth = 0;
  }
  return depth > 0;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default remarkGlossary;
