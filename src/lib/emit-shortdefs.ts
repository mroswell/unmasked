import { writeFileSync, mkdirSync } from 'node:fs';
import { loadShortDefs, loadAliases } from './glossary-loader.ts';

export function emitGlossaryAssets(): void {
  mkdirSync('./public', { recursive: true });
  writeFileSync(
    './public/glossary-shortdefs.json',
    JSON.stringify(loadShortDefs(), null, 2)
  );
  writeFileSync(
    './public/glossary-aliases.json',
    JSON.stringify(loadAliases(), null, 2)
  );
}
