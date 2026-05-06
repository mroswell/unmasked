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
  const aliases = [...options.aliases].sort((a, b) => b.alias.length - a.alias.length);

  return (tree) => {
    const wrappedCanonicals = new Set<string>();

    visit(tree, 'text', (node: Text, index, parent: Parent | undefined) => {
      if (!parent || index === undefined) return;
      if (parent.type === 'inlineCode' || parent.type === 'code') return;
      if (isInsideNoGlossSpan(parent, index)) return;

      const replacements: RootContent[] = [];
      let value = node.value;
      let hadReplacement = false;

      for (const { canonical, alias } of aliases) {
        if (wrappedCanonicals.has(canonical)) continue;
        const re = new RegExp(`\\b(${escapeRegex(alias)})\\b`, 'i');
        const match = value.match(re);
        if (!match || match.index === undefined) continue;

        const before = value.slice(0, match.index);
        const after = value.slice(match.index + match[0].length);
        if (before) replacements.push({ type: 'text', value: before } as Text);
        replacements.push({
          type: 'html',
          value: `<dfn data-term="${canonical}">${escapeHtml(match[0])}</dfn>`,
        } as RootContent);
        value = after;
        wrappedCanonicals.add(canonical);
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

export default remarkGlossary;
