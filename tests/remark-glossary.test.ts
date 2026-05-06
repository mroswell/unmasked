import { describe, it, expect } from 'vitest';
import { remark } from 'remark';
import remarkGlossary from '../src/lib/remark-glossary';

const aliases = [
  { canonical: 'masking', alias: 'masking' },
  { canonical: 'masking', alias: 'masked' },
  { canonical: 'mgps', alias: 'MGPS' },
];

async function process(input: string) {
  const out = await remark().use(remarkGlossary, { aliases }).process(input);
  return String(out);
}

describe('remark-glossary', () => {
  it('wraps the first occurrence of an alias', async () => {
    const result = await process('The masking phenomenon is real.');
    expect(result).toContain('<dfn data-term="masking">masking</dfn>');
  });

  it('does not wrap a second occurrence of the same canonical term on the same page', async () => {
    const result = await process('First masking. Second masking.');
    const matches = result.match(/<dfn data-term="masking">/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('matches case-insensitively but preserves the original casing', async () => {
    const result = await process('MGPS is everywhere.');
    expect(result).toContain('<dfn data-term="mgps">MGPS</dfn>');
  });

  it('respects opt-out span', async () => {
    const result = await process('We <span data-no-gloss>masking</span> here.');
    expect(result).not.toContain('<dfn data-term="masking">');
  });

  it('does not wrap inside code spans', async () => {
    // remark()'s default stringifier emits markdown (backticks), not HTML
    // (<code>...</code>). The plugin's contract is "don't wrap text inside
    // inlineCode"; verifying the backtick form here is sufficient.
    const result = await process('Use `masking` literally.');
    expect(result).not.toContain('<dfn data-term="masking">');
    expect(result).toContain('`masking`');
  });

  it('wraps the earliest source-position occurrence when multiple aliases share a canonical', async () => {
    const result = await process('We saw masked outcomes before any masking adjustments.');
    // Expected: "masked" gets wrapped, "masking" does NOT (canonical already used)
    expect(result).toContain('<dfn data-term="masking">masked</dfn>');
    expect(result).not.toContain('<dfn data-term="masking">masking</dfn>');
  });

  it('html-escapes the canonical name in the data-term attribute', async () => {
    const customAliases = [{ canonical: 'a"b<c', alias: 'odd' }];
    const out = await remark().use(remarkGlossary, { aliases: customAliases }).process('an odd term');
    const result = String(out);
    expect(result).toContain('data-term="a&quot;b&lt;c"');
  });
});
