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
import { findBatesPage } from './bates-page-lookup.ts';

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
  base?: string;
}

const remarkCitations: Plugin<[Options], Root> = (options) => {
  const byId = new Map<string, Citation>(options.citations.map((c) => [c.id, c]));
  const base = options.base ?? '/';

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
            ? citationHtml(cit, base)
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

function citationHtml(cit: Citation, base: string): string {
  const popoverId = `popover-${cit.id}`;
  const numericId = cit.id.replace(/^fn-/, '');

  // Link rendering mirrors Citation.astro: a footnote can carry multiple
  // sources (e.g. Bates email + "See also" external testimony) and the
  // popover should surface each one. `base` is import.meta.env.BASE_URL
  // passed through from render-markdown.ts.
  const docLinkHtml = cit.document_id
    ? `<a href="${base}documents/${escapeAttr(cit.document_id)}/" class="cite-link">Read document &rarr;</a>`
    : '';
  let bundleLinkHtml = '';
  if (!cit.document_id) {
    const hit = findBatesPage(cit.bates_ids);
    if (hit) {
      const docHref = `${base}documents/${escapeAttr(hit.bundleId)}/#doc-page-${hit.page}`;
      const textHref = `${base}documents/${escapeAttr(hit.bundleId)}/#text-page-${hit.page}`;
      bundleLinkHtml =
        `<a href="${docHref}" class="cite-link">Read PDF (page ${hit.page}) &rarr;</a>` +
        `<a href="${textHref}" class="cite-link cite-link--secondary">View as text &rarr;</a>`;
    }
  }
  const externalIsPrimary = !docLinkHtml && !bundleLinkHtml;
  const externalLinkHtml = cit.external_url
    ? `<a href="${escapeAttr(cit.external_url)}" class="${externalIsPrimary ? 'cite-link' : 'cite-link cite-link--secondary'}" target="_blank" rel="noopener">${externalIsPrimary ? 'External source' : 'See also: external source'} &rarr;</a>`
    : '';
  const linkHtml =
    docLinkHtml || bundleLinkHtml || externalLinkHtml
      ? docLinkHtml + bundleLinkHtml + externalLinkHtml
      : `<span class="cite-link cite-link--unavailable">Document not publicly posted</span>`;

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
