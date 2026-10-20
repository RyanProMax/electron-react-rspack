import fs from 'fs';
import path from 'path';
import { Channels } from '../src/common/constant';
import { expect, test } from './fixtures';

const mainEntry = path.resolve(__dirname, '../build/loader.js');

test('app launches and the first window appears', async ({ electronApp, window }) => {
  expect(window.isClosed()).toBe(false);
  await expect(window.locator('#root')).toBeAttached();
  expect(electronApp.windows()).toHaveLength(1);
});

test('renderer loads the home page', async ({ window }) => {
  await expect(window).toHaveTitle('Home - Electron React App');
  await expect(window.locator('.home__title')).toHaveText('Electron React Rspack');
});

test('theme toggle switches to dark mode', async ({ window }) => {
  const body = window.locator('body');
  const themeToggle = window.locator('.home__content button').filter({
    has: window.locator('.arco-icon-sun'),
  });

  await expect(body).not.toHaveAttribute('arco-theme');
  await themeToggle.click();

  await expect(body).toHaveAttribute('arco-theme', 'dark');
  await expect
    .poll(() => window.evaluate(() => window.localStorage.getItem('__THEME__')))
    .toBe('dark');
});

test('main process bridge reads the app path and user store', async ({ electronApp, window }) => {
  const appPath = await electronApp.evaluate(({ app }) => app.getAppPath());
  // Launching build/loader.js directly: that directory has no package.json, so
  // Electron reports the entry directory as the app path.
  expect(path.resolve(appPath)).toBe(path.dirname(mainEntry));
  expect(fs.existsSync(path.join(appPath, 'loader.js'))).toBe(true);

  const stored = await window.evaluate(
    async ({ getChannel, setChannel }) => {
      await window.__ELECTRON__.ipcRenderer.invoke(setChannel, 'e2eProbe', 'ok');
      return window.__ELECTRON__.ipcRenderer.invoke(getChannel, 'e2eProbe');
    },
    { getChannel: Channels.GetUserStore, setChannel: Channels.SetUserStore }
  );

  expect(stored).toBe('ok');
});
