import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const TIMELINE_CATEGORIES = ['regulatory', 'analysis', 'internal', 'publication', 'oversight'] as const;

const timeline = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/timeline' }),
  schema: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be ISO YYYY-MM-DD'),
    date_display: z.string(),
    summary: z.string(),
    actors: z.array(z.string()).default([]),
    citations: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    category: z.enum(TIMELINE_CATEGORIES),
    body: z.string(),
  }),
});

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
  schema: z.object({
    term: z.string(),
    aliases: z.array(z.string()).default([]),
    short_def: z.string().max(280),
    category: z.string().optional(),
  }),
});

const documents = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/documents' }),
  schema: z.object({
    bates_id: z.string(),
    title: z.string(),
    doc_type: z.enum(['email', 'presentation', 'spreadsheet', 'paper', 'letter', 'testimony', 'report', 'other']),
    date: z.string().optional(),
    page_count: z.number().int().positive().optional(),
    source_url: z.string().url(),
    pdf_path: z.string(),
    ocr_text_path: z.string(),
    split_from: z.string().nullable().default(null),
  }),
});

const quotes = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/quotes' }),
  schema: z.object({
    id: z.string(),
    speaker: z.string(),
    date: z.string(),
    text: z.string(),
    context: z.string(),
    emphasis_words: z.array(z.string()).default([]),
    citation_id: z.string().optional(),
    topic: z.array(z.string()).default([]),
  }),
});

const actors = defineCollection({
  loader: file('./src/content/actors.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role_at_time: z.string(),
    short_bio: z.string(),
  }),
});

const citations = defineCollection({
  loader: file('./src/content/citations.json'),
  schema: z.object({
    id: z.string(),
    bates_ids: z.array(z.string()).default([]),
    footnote_text: z.string(),
    document_id: z.string().nullable().default(null),
    external_url: z.string().url().nullable().default(null),
    emphasis_note: z.string().optional(),
  }),
});

export const collections = { timeline, glossary, documents, quotes, actors, citations };
