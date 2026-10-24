import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { rendererEntries } from '../scripts/renderer-entries.mjs';

test('renderer entries include sorted source files, skip directories/declarations and reject duplicates', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rspack-entries-'));
  try {
    for (const name of ['z.tsx', 'b.js', 'a.jsx', 'c.ts', 'README.md', 'types.d.ts', '.DS_Store'])
      fs.writeFileSync(path.join(directory, name), '');
    fs.mkdirSync(path.join(directory, 'nested.tsx'));
    assert.deepEqual(Object.keys(rendererEntries(directory)), ['a', 'b', 'c', 'z']);
    fs.writeFileSync(path.join(directory, 'a.tsx'), '');
    assert.throws(() => rendererEntries(directory), /Duplicate renderer entry: a/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('all configs resolve paths from their files and main/preload preserve the shared output', async () => {
  const previous = process.cwd();
  const root = path.resolve(__dirname, '..');
  try {
    process.chdir(os.tmpdir());
    const { default: main } = await import('../src/main/rspack.config.mjs');
    const { default: preload } = await import('../src/preload/rspack.config.mjs');
    const { default: renderer } = await import('../src/renderer/rspack.config.mjs');
    assert.deepEqual(
      [main.target, preload.target, renderer.target],
      ['electron-main', 'electron-preload', 'web']
    );
    for (const config of [main, preload, renderer]) {
      assert.equal(config.context, config === renderer ? path.join(root, 'src/renderer') : root);
      assert.equal(config.resolve!.tsConfig, path.join(root, 'tsconfig.json'));
    }
    for (const config of [main, preload]) {
      assert.equal(config.output!.path, path.join(root, 'build'));
      assert.equal(config.output!.clean, false);
      assert.equal(config.devtool, 'source-map');
    }
    assert.equal(renderer.output!.path, path.join(root, 'build/renderer'));
    assert.deepEqual(Object.keys(renderer.entry!), ['about', 'home', 'update']);
    assert.equal(
      require.cache[require.resolve('../src/main/utils')],
      undefined,
      'renderer config must not import Electron main utilities'
    );
  } finally {
    process.chdir(previous);
  }
});
