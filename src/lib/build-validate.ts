import { getCollection } from 'astro:content';
import { validateCrossReferences } from './validate-cross-references';

export async function runBuildValidation(): Promise<void> {
  const [timelineEvents, citations, documents, actors, glossaryEntries] = await Promise.all([
    getCollection('timeline'),
    getCollection('citations'),
    getCollection('documents'),
    getCollection('actors'),
    getCollection('glossary'),
  ]);

  const glossaryAliases = glossaryEntries.flatMap((g) => [g.data.term, ...g.data.aliases]);

  const result = validateCrossReferences({
    timelineEvents: timelineEvents.map((t) => ({ data: { actors: t.data.actors, citations: t.data.citations } })),
    citations: citations.map((c) => ({ id: c.data.id, document_id: c.data.document_id })),
    documents: documents.map((d) => ({ bates_id: d.data.bates_id })),
    actors: actors.map((a) => ({ id: a.data.id })),
    glossaryAliases,
  });

  if (result.errors.length > 0) {
    console.error('Cross-reference validation failed:');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    throw new Error(`${result.errors.length} cross-reference error(s)`);
  }
}
