import { describe, it, expect } from 'vitest';
import { validateCrossReferences } from '../src/lib/validate-cross-references';

describe('validateCrossReferences', () => {
  it('passes when all references resolve', () => {
    const result = validateCrossReferences({
      timelineEvents: [{ data: { actors: ['szarfman'], citations: ['fn-1'] } }],
      citations: [{ id: 'fn-1', document_id: 'doc-1' }],
      documents: [{ bates_id: 'doc-1' }],
      actors: [{ id: 'szarfman' }],
      glossaryAliases: ['masking', 'MGPS'],
    });
    expect(result.errors).toEqual([]);
  });

  it('reports unknown actor referenced by timeline event', () => {
    const result = validateCrossReferences({
      timelineEvents: [{ data: { actors: ['unknown'], citations: [] } }],
      citations: [],
      documents: [],
      actors: [{ id: 'szarfman' }],
      glossaryAliases: [],
    });
    expect(result.errors).toContain('Timeline event references unknown actor: "unknown"');
  });

  it('reports unknown citation referenced by timeline event', () => {
    const result = validateCrossReferences({
      timelineEvents: [{ data: { actors: [], citations: ['fn-missing'] } }],
      citations: [],
      documents: [],
      actors: [],
      glossaryAliases: [],
    });
    expect(result.errors).toContain('Timeline event references unknown citation: "fn-missing"');
  });

  it('reports non-null document_id that does not resolve', () => {
    const result = validateCrossReferences({
      timelineEvents: [],
      citations: [{ id: 'fn-1', document_id: 'missing-doc' }],
      documents: [],
      actors: [],
      glossaryAliases: [],
    });
    expect(result.errors).toContain('Citation "fn-1" references unknown document_id: "missing-doc"');
  });

  it('allows null document_id', () => {
    const result = validateCrossReferences({
      timelineEvents: [],
      citations: [{ id: 'fn-1', document_id: null }],
      documents: [],
      actors: [],
      glossaryAliases: [],
    });
    expect(result.errors).toEqual([]);
  });

  it('reports duplicate glossary alias', () => {
    const result = validateCrossReferences({
      timelineEvents: [],
      citations: [],
      documents: [],
      actors: [],
      glossaryAliases: ['masking', 'masking'],
    });
    expect(result.errors).toContain('Duplicate glossary alias: "masking"');
  });
});
