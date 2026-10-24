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

test('main process bridge reads the app path and user store', async ({
  electronApp,
  window: page,
}) => {
  const appPath = await electronApp.evaluate(({ app }) => app.getAppPath());
  // Launching build/loader.js directly: that directory has no package.json, so
  // Electron reports the entry directory as the app path.
  expect(path.resolve(appPath)).toBe(path.dirname(mainEntry));
  expect(fs.existsSync(path.join(appPath, 'loader.js'))).toBe(true);

  const stored = await page.evaluate(
    async ({ getChannel, setChannel }) => {
      await window.__ELECTRON__.ipcRenderer.invoke(setChannel, 'e2eProbe', 'ok');
      return window.__ELECTRON__.ipcRenderer.invoke(getChannel, 'e2eProbe');
    },
    { getChannel: Channels.GetUserStore, setChannel: Channels.SetUserStore }
  );

  expect(stored).toBe('ok');
});

test('About retains a cancelled close, reopens, and shares styled theme changes', async ({
  electronApp,
  window: page,
}) => {
  const openAbout = async () => {
    const opened = electronApp.waitForEvent('window');
    await page
      .locator('.home__content button')
      .filter({ has: page.locator('.arco-icon-bulb') })
      .click();
    const about = await opened;
    await expect(about).toHaveTitle('About - Electron React App');
    await expect(about.locator('.about__description')).toContainText('Electron');
    return about;
  };
  const about = await openAbout();
  // Actual Arco LESS must be applied with webSecurity enabled.
  expect(
    await page
      .locator('.home__content button')
      .first()
      .evaluate((element) => getComputedStyle(element).borderRadius)
  ).toBe('50%');
  await page
    .locator('.home__content button')
    .filter({ has: page.locator('.arco-icon-sun') })
    .click();
  await expect(about.locator('body')).toHaveAttribute('arco-theme', 'dark');
  const aboutId = await electronApp.evaluate(({ BrowserWindow }) => {
    const about = BrowserWindow.getAllWindows().find((window) =>
      new URL(window.webContents.getURL()).pathname.endsWith('/about.html')
    )!;
    about.once('close', (event) => event.preventDefault());
    return about.id;
  });
  await about.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Close'));
  await expect
    .poll(() =>
      electronApp.evaluate(({ BrowserWindow }, id) => Boolean(BrowserWindow.fromId(id)), aboutId)
    )
    .toBe(true);
  // The second close must target the retained window, not a duplicate instance.
  const closed = about.waitForEvent('close');
  await about.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Close'));
  await closed;
  expect(page.isClosed()).toBe(false);
  const reopened = await openAbout();
  expect(electronApp.windows()).toHaveLength(2);
  await expect(reopened.locator('.about__versions')).toContainText(
    await electronApp.evaluate(() => process.versions.electron)
  );
});

test('external links enforce URL and sender policy in the real Electron process', async ({
  electronApp,
  window: page,
}) => {
  const calls = await electronApp.evaluateHandle(({ shell }) => {
    const calls: string[] = [];
    shell.openExternal = async (url) => {
      calls.push(url);
    };
    return calls;
  });
  await page.evaluate(() => {
    const ipc = window.__ELECTRON__.ipcRenderer;
    ipc.send('OpenExternal', 'https://example.com/ipc');
    for (const url of [
      'file:///tmp/blocked',
      'javascript:alert(1)',
      'https://user:pass@example.com',
      'not a url',
    ])
      ipc.send('OpenExternal', url);
    ipc.send('OpenExternal', 'https://example.com/blocked-options', { workingDirectory: '/tmp' });
  });
  await expect.poll(() => calls.jsonValue()).toEqual(['https://example.com/ipc']);
  const rejected = await electronApp.evaluate(async ({ BrowserWindow, ipcMain }) => {
    const home = BrowserWindow.getAllWindows()[0];
    const unmanaged = new BrowserWindow({ show: false });
    await unmanaged.loadURL('data:text/html,untrusted');
    for (const source of [
      { sender: unmanaged.webContents, senderFrame: unmanaged.webContents.mainFrame },
      { sender: home.webContents, senderFrame: null },
      {
        sender: home.webContents,
        senderFrame: { url: home.webContents.getURL(), detached: false },
      },
    ])
      ipcMain.emit('OpenExternal', source, 'https://example.com/blocked-source');
    unmanaged.destroy();
    return true;
  });
  expect(rejected).toBe(true);
  await page.evaluate(() => {
    const anchor = document.createElement('a');
    anchor.href = 'https://example.com/navigation';
    document.body.append(anchor);
    anchor.click();
    anchor.target = '_blank';
    anchor.href = 'https://example.com/popup';
    anchor.click();
    anchor.remove();
  });
  await expect
    .poll(async () => (await calls.jsonValue()).sort())
    .toEqual([
      'https://example.com/ipc',
      'https://example.com/navigation',
      'https://example.com/popup',
    ]);
  expect(electronApp.windows()).toHaveLength(1);
  // Playwright may keep waiting for a navigation Electron has prevented. Read
  // the actual native window state after the clicks instead.
  const state = await electronApp.evaluate(({ BrowserWindow }) => {
    const home = BrowserWindow.getAllWindows()[0];
    return { title: home.getTitle(), url: home.webContents.getURL() };
  });
  expect(state.title).toBe('Home - Electron React App');
  expect(new URL(state.url).pathname.endsWith('/home.html')).toBe(true);
  await calls.dispose();
});
