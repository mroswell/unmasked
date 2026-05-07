// Remark plugin that recognizes [^fn-N] markdown footnote markers in body
// text and replaces them with the same popover-trigger markup the
// <Citation> Astro component emits. Reads citations.json so the popover
// has the actual footnote text + link to a backing document, where one
// exists.
//
// Note on element choice: the popover is rendered as a <span popover>,
// not a <div popover>, because markdown wraps text in <p> and a <div>
// child would force the browser to auto-close the surrounding <p>.

import type { Plugin } from 'unified';
import type { Root, Text, Parent, RootContent } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';

interface Citation {
  id: string;
  bates_ids: string[];
  footnote_text: string;
  document_id: string | null;
  external_url: string | null;
  emphasis_note?: string;
}

interface Options {
  citations: Citation[];
}

const remarkCitations: Plugin<[Options], Root> = (options) => {
  const byId = new Map<string, Citation>(options.citations.map((c) => [c.id, c]));

  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent: Parent | undefined) => {
      if (!parent || index === undefined) return;
      if (parent.type === 'inlineCode' || parent.type === 'code') return;

      const value = node.value;
      const re = /\[\^fn-(\d+)\]/g;
      const matches = [...value.matchAll(re)];
      if (matches.length === 0) return;

      const replacements: RootContent[] = [];
      let lastEnd = 0;
      for (const m of matches) {
        const start = m.index!;
        const end = start + m[0].length;
        if (start > lastEnd) {
          replacements.push({ type: 'text', value: value.slice(lastEnd, start) } as Text);
        }
        const citId = `fn-${m[1]}`;
        const cit = byId.get(citId);
        replacements.push({
          type: 'html',
          value: cit
            ? citationHtml(cit)
            : `<span class="cite-marker cite-marker--unresolved">[${m[1]}]</span>`,
        } as RootContent);
        lastEnd = end;
      }
      if (lastEnd < value.length) {
        replacements.push({ type: 'text', value: value.slice(lastEnd) } as Text);
      }
      parent.children.splice(index, 1, ...replacements);
      return [SKIP, index + replacements.length];
    });
  };
};

function citationHtml(cit: Citation): string {
  const popoverId = `popover-${cit.id}`;
  const numericId = cit.id.replace(/^fn-/, '');

  let linkHtml: string;
  if (cit.document_id) {
    // Root-relative — gets prefixed with the deploy base by scripts/07-rewrite-paths-for-base.mjs
    linkHtml = `<a href="/documents/${escapeAttr(cit.document_id)}/" class="cite-link">Read document &rarr;</a>`;
  } else if (cit.external_url) {
    linkHtml = `<a href="${escapeAttr(cit.external_url)}" class="cite-link" target="_blank" rel="noopener">External source &rarr;</a>`;
  } else {
    linkHtml = `<span class="cite-link cite-link--unavailable">Document not publicly posted</span>`;
  }

  const batesHtml = cit.bates_ids?.length
    ? `<span class="cite-bates">${escapeHtml(cit.bates_ids.join('; '))}</span>`
    : '';

  return [
    `<button type="button" popovertarget="${popoverId}" class="cite-marker">[${numericId}]</button>`,
    `<span popover="auto" id="${popoverId}" class="cite-popover">`,
    `<span class="cite-text">${escapeHtml(cit.footnote_text)}</span>`,
    batesHtml,
    linkHtml,
    `</span>`,
  ].join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export default remarkCitations;
