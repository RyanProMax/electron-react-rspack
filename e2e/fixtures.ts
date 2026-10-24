import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  _electron as electron,
  test as base,
  type ElectronApplication,
  type Page,
  type TestInfo,
} from '@playwright/test';

const repoRoot = path.resolve(__dirname, '..');
const mainEntry = path.join(repoRoot, 'build', 'loader.js');
const executable = process.env.E2E_EXECUTABLE
  ? path.resolve(repoRoot, process.env.E2E_EXECUTABLE)
  : undefined;
if (executable && !executable.startsWith(path.join(repoRoot, 'release/regression') + path.sep))
  throw new Error('Packaged tests only launch the isolated regression output');
// Deliberately launch from outside src/main to exercise cwd-independent paths.
const launchCwd = repoRoot;

type ElectronFixtures = {
  electronApp: ElectronApplication;
  window: Page;
};

function electronEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') {
      env[key] = value;
    }
  }
  // A leaked ELECTRON_RUN_AS_NODE makes the binary run as plain Node.
  delete env.ELECTRON_RUN_AS_NODE;
  env.ELECTRON_SKIP_UPDATE = '1';
  env.NODE_ENV = process.env.E2E_DEV === '1' ? 'development' : 'production';
  return env;
}

async function neutralizeNativeDialogs(app: ElectronApplication) {
  await app.evaluate(({ dialog }) => {
    dialog.showErrorBox = () => undefined;
    dialog.showMessageBoxSync = () => 0;
    dialog.showMessageBox = () => Promise.resolve({ response: 0, checkboxChecked: false });
    dialog.showOpenDialogSync = () => undefined;
    dialog.showOpenDialog = () => Promise.resolve({ canceled: true, filePaths: [] });
    dialog.showSaveDialogSync = () => '';
    dialog.showSaveDialog = () => Promise.resolve({ canceled: true, filePath: '' });
  });
}

async function attachFailureArtifacts(app: ElectronApplication, testInfo: TestInfo) {
  const failed = testInfo.status !== testInfo.expectedStatus;
  const tracePath = testInfo.outputPath('trace.zip');
  await app
    .context()
    .tracing.stop(failed ? { path: tracePath } : undefined)
    .catch(() => undefined);
  if (failed && fs.existsSync(tracePath)) {
    await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' });
  }
}

export const test = base.extend<ElectronFixtures>({
  // Playwright requires an object destructure here; this fixture has no dependencies.
  // eslint-disable-next-line no-empty-pattern
  electronApp: async ({}, use, testInfo) => {
    if (!fs.existsSync(executable || mainEntry)) {
      throw new Error('Missing build/loader.js. Run `pnpm build` before `pnpm test:e2e`.');
    }

    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'electron-react-rspack-e2e-'));
    let app: ElectronApplication | undefined;
    try {
      app = await electron.launch({
        executablePath: executable,
        args: [...(executable ? [] : [mainEntry]), `--user-data-dir=${userDataDir}`],
        cwd: launchCwd,
        env: electronEnv(),
        colorScheme: 'light',
        offline: process.env.E2E_DEV !== '1',
        timeout: 60_000,
      });
      await app.context().tracing.start({ screenshots: true, snapshots: true });
      await neutralizeNativeDialogs(app);
      await use(app);
    } finally {
      if (app) {
        await attachFailureArtifacts(app, testInfo);
        await app.close().catch(() => undefined);
      }
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },

  window: async ({ electronApp }, use, testInfo) => {
    const page = await electronApp.firstWindow();
    await use(page);
    if (testInfo.status !== testInfo.expectedStatus && !page.isClosed()) {
      const screenshot = testInfo.outputPath('failure.png');
      await page.screenshot({ path: screenshot }).catch(() => undefined);
      if (fs.existsSync(screenshot)) {
        await testInfo.attach('screenshot', { path: screenshot, contentType: 'image/png' });
      }
    }
  },
});

export { expect } from '@playwright/test';
