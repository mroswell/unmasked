import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

interface GlossaryEntry {
  canonical: string;
  term: string;
  aliases: string[];
  short_def: string;
}

const GLOSSARY_DIR = './src/content/glossary';

export function loadGlossary(): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];
  const files = readdirSync(GLOSSARY_DIR).filter((f) => f.endsWith('.md'));
  for (const filename of files) {
    const content = readFileSync(join(GLOSSARY_DIR, filename), 'utf-8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    const fm = parseYaml(fmMatch[1]);
    const canonical = (fm.term as string).toLowerCase();
    entries.push({
      canonical,
      term: fm.term as string,
      aliases: Array.isArray(fm.aliases) ? fm.aliases : [],
      short_def: fm.short_def as string,
    });
  }
  return entries;
}

export function loadAliases(): Array<{ canonical: string; alias: string }> {
  const result: Array<{ canonical: string; alias: string }> = [];
  for (const entry of loadGlossary()) {
    result.push({ canonical: entry.canonical, alias: entry.term });
    for (const a of entry.aliases) {
      result.push({ canonical: entry.canonical, alias: a });
    }
  }
  return result;
}

export function loadShortDefs(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entry of loadGlossary()) {
    map[entry.canonical] = entry.short_def;
  }
  return map;
}
