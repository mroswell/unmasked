type TimelineEvent = { data: { actors: string[]; citations: string[] } };
type Citation = { id: string; document_id: string | null };
type Document = { bates_id: string };
type Actor = { id: string };

export interface ValidationInput {
  timelineEvents: TimelineEvent[];
  citations: Citation[];
  documents: Document[];
  actors: Actor[];
  glossaryAliases: string[];
}

export interface ValidationResult {
  errors: string[];
}

export function validateCrossReferences(input: ValidationInput): ValidationResult {
  const errors: string[] = [];

  const actorIds = new Set(input.actors.map((a) => a.id));
  const citationIds = new Set(input.citations.map((c) => c.id));
  const documentIds = new Set(input.documents.map((d) => d.bates_id));

  for (const ev of input.timelineEvents) {
    for (const actorId of ev.data.actors) {
      if (!actorIds.has(actorId)) {
        errors.push(`Timeline event references unknown actor: "${actorId}"`);
      }
    }
    for (const citId of ev.data.citations) {
      if (!citationIds.has(citId)) {
        errors.push(`Timeline event references unknown citation: "${citId}"`);
      }
    }
  }

  for (const cit of input.citations) {
    if (cit.document_id !== null && !documentIds.has(cit.document_id)) {
      errors.push(`Citation "${cit.id}" references unknown document_id: "${cit.document_id}"`);
    }
  }

  const seenAliases = new Set<string>();
  for (const alias of input.glossaryAliases) {
    if (seenAliases.has(alias)) {
      errors.push(`Duplicate glossary alias: "${alias}"`);
    }
    seenAliases.add(alias);
  }

  return { errors };
}
