// Strip the external URL from a footnote's display text, since the same
// URL is rendered as a clickable "External source" / "See also" link
// directly below the prose in the citation popover. Used by both
// src/components/Citation.astro and src/lib/remark-citations.ts.
//
// All 79 footnotes whose footnote_text contains a URL have that exact
// URL also stored in external_url, so a literal substring replace is
// reliable (verified at build time against citations.json).
//
// After removing the URL the function tidies up punctuation that was
// left dangling around it (", ." → ".", ", ;" → ";", etc.). If what
// remains is just a connector phrase like "Available at." or "See.",
// returns the empty string — the popover should hide the prose
// paragraph entirely in that case.

export function cleanFootnoteText(text: string, url: string | null | undefined): string {
  if (!url || !text || !text.includes(url)) return text;
  const cleaned = text
    .replace(url, '')
    .replace(/,\s*\./g, '.')        // ", ." → "."
    .replace(/,\s*,/g, ',')         // ", ," → ","
    .replace(/,\s*;/g, ';')         // ", ;" → ";"
    .replace(/,\s*\)/g, ')')        // ", )" → ")"
    .replace(/\s+([.,;:)])/g, '$1') // residual " ." → "."
    .replace(/\s+/g, ' ')           // collapse multi-space
    .trim();
  if (/^(available at|see also,?|see e\.g\.,?|see,?)\.?\s*$/i.test(cleaned)) {
    return '';
  }
  return cleaned;
}
