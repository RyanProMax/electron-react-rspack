import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';

test('both direct and CLI dev-server resolutions exclude the vulnerable vendored editor', () => {
  const cliRequire = createRequire(require.resolve('@rspack/cli'));
  const entries = new Set([
    require.resolve('@rspack/dev-server'),
    cliRequire.resolve('@rspack/dev-server'),
  ]);
  for (const entry of entries) {
    const dist = path.dirname(entry);
    const metadata = JSON.parse(fs.readFileSync(path.join(dist, '../package.json'), 'utf8'));
    // A future official release must be reviewed before retiring this patch.
    assert.equal(metadata.version, '2.2.1');
    assert.equal(fs.existsSync(path.join(dist, '0~launch-editor.js')), false);
    for (const file of fs.readdirSync(dist).filter((file) => file.endsWith('.js'))) {
      assert.doesNotMatch(
        fs.readFileSync(path.join(dist, file), 'utf8'),
        /launch-editor|launchEditor/,
        `Executable editor code or references remain in ${file}`
      );
    }
  }
});
