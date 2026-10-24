// @ts-check
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

if (process.platform !== 'darwin' || !['arm64', 'x64'].includes(process.arch))
  throw new Error('This local regression package targets the current macOS architecture');
const root = path.resolve(import.meta.dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'electron-package-regression-'));
const base = JSON.parse(fs.readFileSync(path.join(root, 'build.config.json'), 'utf8'));
const config = {
  ...base,
  appId: 'com.ryan.electronrspack.regression',
  productName: 'ElectronRspackRegression',
  publish: null,
  directories: { ...base.directories, output: path.join(root, 'release/regression') },
  mac: { ...base.mac, identity: null, target: [{ target: 'zip', arch: [process.arch] }] },
};
const file = path.join(temporary, 'config.json');
fs.writeFileSync(file, JSON.stringify(config));
try {
  const require = createRequire(import.meta.url);
  const cli = require.resolve('electron-builder/out/cli/cli.js');
  const result = spawnSync(
    process.execPath,
    [
      cli,
      '--projectDir',
      root,
      '--config',
      file,
      '--mac',
      'zip',
      `--${process.arch}`,
      '--publish',
      'never',
    ],
    {
      cwd: root,
      env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' },
      stdio: 'inherit',
    }
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
