import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test, expect } from './fixtures';

const preload = path.resolve(__dirname, '../build/preload.js');

test('native resize respects main minimum size and emits resize', async ({
  electronApp,
  window: page,
}) => {
  const nativeWindow = await electronApp.browserWindow(page);
  const initial = await nativeWindow.evaluate((window) => ({
    bounds: window.getBounds(),
    min: window.getMinimumSize(),
    resizable: window.isResizable(),
  }));
  expect(initial.min).toEqual([720, 480]);
  expect(initial.resizable).toBe(true);
  const resized = nativeWindow.evaluate(
    (window) =>
      new Promise<void>((resolve) => {
        window.once('resize', () => resolve());
        window.setSize(800, 560);
      })
  );
  await resized;
  await expect.poll(() => nativeWindow.evaluate((window) => window.getSize())).toEqual([800, 560]);
  await nativeWindow.evaluate((window) => window.setSize(100, 100));
  await expect
    .poll(() =>
      nativeWindow.evaluate((window) => {
        const [w, h] = window.getSize();
        return w >= 720 && h >= 480;
      })
    )
    .toBe(true);
});

test('renderer Minimize/Maximize and native restore operate on the real window', async ({
  electronApp,
  window: page,
}) => {
  test.skip(
    process.platform === 'linux',
    'xvfb CI has no window manager for native minimize/maximize'
  );
  const nativeWindow = await electronApp.browserWindow(page);
  await page.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Maximize'));
  await expect.poll(() => nativeWindow.evaluate((window) => window.isMaximized())).toBe(true);
  await page.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Maximize'));
  await expect.poll(() => nativeWindow.evaluate((window) => window.isMaximized())).toBe(false);
  await page.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Minimize'));
  await expect.poll(() => nativeWindow.evaluate((window) => window.isMinimized())).toBe(true);
  await nativeWindow.evaluate((window) => {
    window.restore();
    window.show();
  });
  await expect.poll(() => nativeWindow.evaluate((window) => window.isMinimized())).toBe(false);
});

test('renderer Quit can be cancelled before-quit and then really exits only its test app', async ({
  electronApp,
  window: page,
}) => {
  await electronApp.evaluate(({ app }) => {
    app.once('before-quit', (event) => event.preventDefault());
  });
  await page.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Quit'));
  await expect(page.locator('.home__title')).toBeVisible();
  const pkg = await page.evaluate(() => window.__ELECTRON__.ipcRenderer.invoke('GetPackageJson'));
  expect(JSON.parse(pkg).name).toBe('electron-react-rspack');
  const exited = electronApp.waitForEvent('close');
  await page.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Quit')).catch(() => undefined);
  await exited;
});

test('renderer Home Close exits the isolated app instead of only hiding home', async ({
  electronApp,
  window: page,
}) => {
  const exited = electronApp.waitForEvent('close');
  await page.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Close')).catch(() => undefined);
  await exited;
});

test('real unmanaged renderer and real cross-origin iframe cannot use managed IPC', async ({
  electronApp,
  window: page,
}) => {
  const shellCalls = await electronApp.evaluateHandle(({ shell }) => {
    const calls: string[] = [];
    shell.openExternal = async (url) => {
      calls.push(url);
    };
    return calls;
  });
  const opened = electronApp.waitForEvent('window');
  await electronApp.evaluate(async ({ BrowserWindow }, preload) => {
    const window = new BrowserWindow({ show: false, webPreferences: { preload } });
    await window.loadURL('data:text/html,<title>Unmanaged IPC probe</title>');
  }, preload);
  const unmanaged = await opened;
  await expect(unmanaged).toHaveTitle('Unmanaged IPC probe');
  const failures = await unmanaged.evaluate(async () => {
    const ipc = window.__ELECTRON__.ipcRenderer;
    const failures: string[] = [];
    for (const channel of ['GetPackageJson', 'GetUserStore', 'SetUserStore']) {
      try {
        await ipc.invoke(channel, 'unauthorized', 'write');
      } catch {
        failures.push(channel);
      }
    }
    for (const channel of ['Quit', 'Close', 'Minimize', 'Maximize', 'AboutMe']) ipc.send(channel);
    ipc.send('OpenExternal', 'https://example.com/blocked');
    ipc.send('Broadcast', 'ToggleTheme', 'dark');
    return failures;
  });
  expect(failures).toEqual(['GetPackageJson', 'GetUserStore', 'SetUserStore']);
  await page.evaluate(() => {
    const frame = document.createElement('iframe');
    frame.id = 'ipc-frame';
    frame.src = 'data:text/html,<title>Cross-origin IPC probe</title>';
    document.body.append(frame);
  });
  const frame = page.frameLocator('#ipc-frame');
  await expect
    .poll(() => frame.locator('html').evaluate(() => document.title))
    .toBe('Cross-origin IPC probe');
  const isolation = await frame.locator('html').evaluate(() => {
    let parentBlocked = false;
    try {
      void window.parent.__ELECTRON__;
    } catch {
      parentBlocked = true;
    }
    return { ownBridge: typeof window.__ELECTRON__, parentBlocked };
  });
  expect(isolation).toEqual({ ownBridge: 'undefined', parentBlocked: true });
  // Real child-frame identity, deliberately synthetic main-side events. No unsafe
  // subframe Node integration/preload options are enabled to manufacture IPC.
  await electronApp.evaluate(({ BrowserWindow, ipcMain }) => {
    const home = BrowserWindow.getAllWindows().find((w) =>
      w.webContents.getURL().includes('home.html')
    )!;
    const child = home.webContents.mainFrame.frames.find((f) => f.url.startsWith('data:'))!;
    for (const channel of ['Quit', 'Close', 'Minimize', 'Maximize', 'AboutMe'])
      ipcMain.emit(channel, { sender: home.webContents, senderFrame: child });
    ipcMain.emit(
      'OpenExternal',
      { sender: home.webContents, senderFrame: child },
      'https://example.com/blocked-frame'
    );
  });
  await page.evaluate(() => document.querySelector('#ipc-frame')!.remove());
  await expect(page.locator('body')).not.toHaveAttribute('arco-theme');
  expect(await shellCalls.jsonValue()).toEqual([]);
  expect(electronApp.windows()).toHaveLength(2);
  await unmanaged.close();
  const win = await electronApp.browserWindow(page);
  expect(await win.evaluate((w) => w.isMinimized() || w.isMaximized())).toBe(false);
  for (const channel of ['GetUserStore', 'SetUserStore']) {
    expect(
      await page.evaluate(async (channel) => {
        try {
          await window.__ELECTRON__.ipcRenderer.invoke(channel, null, 'bad');
          return false;
        } catch {
          return true;
        }
      }, channel)
    ).toBe(true);
  }
});

test('Home/About light-dark-light visuals at desktop, minimum and 125 percent zoom', async ({
  electronApp,
  window: page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const opened = electronApp.waitForEvent('window');
  await page.evaluate(() => window.__ELECTRON__.ipcRenderer.send('AboutMe'));
  const about = await opened;
  about.on('pageerror', (error) => errors.push(error.message));
  await expect(about.locator('.about__description')).toContainText('Electron');
  const nativeWindow = await electronApp.browserWindow(page);
  const artifactRoot = process.env.E2E_VISUAL_DIR || testInfo.outputPath('visuals');
  fs.mkdirSync(artifactRoot, { recursive: true });
  const prefix =
    process.env.E2E_DEV === '1' ? 'dev' : process.env.E2E_EXECUTABLE ? 'packaged' : 'prod';
  const aboutWindow = await electronApp.browserWindow(about);
  const capture = async (name: string) => {
    // CDP screenshot clipping uses CSS dimensions after Electron page zoom.
    // Native capture records the whole actual BrowserWindow content instead.
    for (const [label, handle] of [
      ['home', nativeWindow],
      ['about', aboutWindow],
    ] as const) {
      const png = await handle.evaluate(async (window) =>
        (await window.webContents.capturePage()).toPNG().toString('base64')
      );
      fs.writeFileSync(
        path.join(artifactRoot, `${prefix}-${label}-${name}.png`),
        Buffer.from(png, 'base64')
      );
    }
  };
  const backgrounds: string[] = [];
  for (const theme of ['light', 'dark', 'light']) {
    if (theme === 'dark')
      await page
        .locator('.home__content button')
        .filter({ has: page.locator('.arco-icon-sun') })
        .click();
    else if ((await page.locator('body').getAttribute('arco-theme')) === 'dark')
      await page
        .locator('.home__content button')
        .filter({ has: page.locator('.arco-icon-moon') })
        .click();
    if (theme === 'dark') {
      await expect(about.locator('body')).toHaveAttribute('arco-theme', 'dark');
    } else await expect(about.locator('body')).not.toHaveAttribute('arco-theme');
    await expect
      .poll(() =>
        page
          .locator('.menu-icon__item')
          .first()
          .evaluate((el) => getComputedStyle(el).color)
      )
      .toBe(theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)');
    backgrounds.push(
      await about.locator('.about').evaluate((el) => getComputedStyle(el).backgroundColor)
    );
    await capture(theme);
  }
  expect(backgrounds[0]).not.toBe(backgrounds[1]);
  expect(backgrounds[2]).toBe(backgrounds[0]);
  await nativeWindow.evaluate((window) => window.setSize(720, 480));
  await capture('minimum');
  await nativeWindow.evaluate((window) => window.webContents.setZoomFactor(1.25));
  await aboutWindow.evaluate((window) => window.webContents.setZoomFactor(1.25));
  await expect.poll(() => about.evaluate(() => window.innerWidth)).toBe(416);
  await about.locator('.about__footer').scrollIntoViewIfNeeded();
  await expect(about.locator('.about__footer')).toBeInViewport({ ratio: 0.99 });
  await capture('zoom125');
  const displays = await electronApp.evaluate(({ screen }) =>
    screen
      .getAllDisplays()
      .map(({ size, workAreaSize, scaleFactor }) => ({ size, workAreaSize, scaleFactor }))
  );
  fs.writeFileSync(
    path.join(artifactRoot, `${prefix}-display-environment.json`),
    JSON.stringify(displays, null, 2)
  );
  await testInfo.attach('display-environment', {
    body: JSON.stringify(displays),
    contentType: 'application/json',
  });
  expect(errors).toEqual([]);
});

test('macOS LaunchServices reopens the same isolated packaged process after home closes', async ({
  electronApp,
  window: page,
}) => {
  test.skip(
    process.platform !== 'darwin' || !process.env.E2E_EXECUTABLE,
    'Requires the uniquely identified packaged regression app'
  );
  const before = await electronApp.evaluate(() => process.pid);
  const window = await electronApp.browserWindow(page);
  const closed = page.waitForEvent('close');
  await window.evaluate((window) => window.close());
  await closed;
  expect(electronApp.windows()).toHaveLength(0);
  const reopened = electronApp.waitForEvent('window');
  const executable = path.resolve(process.env.E2E_EXECUTABLE!);
  const bundle = path.dirname(path.dirname(path.dirname(executable)));
  execFileSync('/usr/bin/open', ['-a', bundle]);
  const home = await reopened;
  await expect(home.locator('.home__title')).toHaveText('Electron React Rspack');
  expect(await electronApp.evaluate(() => process.pid)).toBe(before);
});
