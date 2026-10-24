// @ts-check
import fs from 'node:fs';
import path from 'node:path';

/** @param {string} directory */
export function rendererEntries(directory) {
  /** @type {Record<string, string>} */
  const entries = Object.create(null);
  const files = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (file) => file.isFile() && /\.(tsx?|jsx?)$/i.test(file.name) && !/\.d\.ts$/i.test(file.name)
    )
    .map((file) => file.name)
    .sort();
  for (const file of files) {
    const name = path.basename(file, path.extname(file));
    if (name in entries) throw new Error(`Duplicate renderer entry: ${name}`);
    entries[name] = path.join(directory, file);
  }
  return entries;
}
