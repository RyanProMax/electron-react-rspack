// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'release/regression');
const executables = fs
  .readdirSync(output, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) =>
    path.join(
      output,
      entry.name,
      'ElectronRspackRegression.app/Contents/MacOS/ElectronRspackRegression'
    )
  )
  .filter((file) => fs.existsSync(file));
if (executables.length !== 1)
  throw new Error('Build exactly one isolated regression app with pnpm package:smoke first');
const require = createRequire(import.meta.url);
const result = spawnSync(
  process.execPath,
  [require.resolve('@playwright/test/cli'), 'test', 'e2e/smoke.spec.ts', 'e2e/windows.spec.ts'],
  { cwd: root, env: { ...process.env, E2E_EXECUTABLE: executables[0] }, stdio: 'inherit' }
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
