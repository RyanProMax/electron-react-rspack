import { defineConfig } from '@playwright/test';

// Electron-only. Specs launch the built app through e2e/fixtures.ts.
// There are no browser projects; `page` from a Chromium/Firefox/WebKit project is unused.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  webServer:
    process.env.E2E_DEV === '1'
      ? {
          command: 'pnpm start:renderer',
          url: `http://localhost:${Number(process.env.PORT) || 9527}/home.html`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        }
      : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  outputDir: process.env.E2E_OUTPUT_DIR || 'test-results',
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
