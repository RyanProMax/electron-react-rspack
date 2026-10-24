import { test, expect, chromium, type Browser } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';

async function freePort() {
  const server = net.createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as net.AddressInfo).port;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}
function stop(child: ChildProcess | undefined) {
  if (!child?.pid || child.exitCode !== null) return;
  try {
    // Only this test's own process group; never a process-name/global kill.
    if (process.platform === 'win32') child.kill();
    else process.kill(-child.pid, 'SIGTERM');
  } catch {
    /* The command may already have exited. */
  }
}

// Playwright requires the fixture object destructure even when unused.
// eslint-disable-next-line no-empty-pattern
test('README start commands and real stylesheet HMR in a disposable source copy', async ({}, testInfo) => {
  test.skip(process.env.E2E_DEV !== '1', 'Development command/HMR check runs in test:e2e:dev');
  test.setTimeout(120_000);
  const root = path.resolve(__dirname, '..');
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'electron-hmr-copy-'));
  const port = await freePort();
  const debuggingPort = await freePort();
  const excluded = new Set([
    'node_modules',
    '.git',
    'build',
    'release',
    'test-results',
    'playwright-report',
    '.env',
  ]);
  fs.cpSync(root, copy, {
    recursive: true,
    filter: (source) =>
      !path
        .relative(root, source)
        .split(path.sep)
        .some((part) => excluded.has(part)),
  });
  for (const relative of ['node_modules', 'src/renderer/node_modules'])
    fs.symlinkSync(
      path.join(root, relative),
      path.join(copy, relative),
      process.platform === 'win32' ? 'junction' : 'dir'
    );
  fs.writeFileSync(path.join(copy, '.env'), `PORT=${port}\n`);
  fs.cpSync(path.join(root, 'build'), path.join(copy, 'build'), { recursive: true });
  const pnpm = process.env.npm_execpath!;
  const env: NodeJS.ProcessEnv = { ...process.env, ELECTRON_SKIP_UPDATE: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.PORT;
  let renderer: ChildProcess | undefined;
  let main: ChildProcess | undefined;
  let browser: Browser | undefined;
  const logs: string[] = [];
  const start = (args: string[]) => {
    const child = spawn(process.execPath, [pnpm, ...args], {
      cwd: copy,
      env,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout!.on('data', (data) => logs.push(String(data)));
    child.stderr!.on('data', (data) => logs.push(String(data)));
    return child;
  };
  try {
    renderer = start(['start:renderer']);
    await expect
      .poll(
        async () => {
          try {
            return (await fetch(`http://localhost:${port}/home.html`)).status;
          } catch {
            return 0;
          }
        },
        { timeout: 60_000 }
      )
      .toBe(200);
    // Exercise an explicit development preload build as well as the README's
    // normal preload build, without changing the user's checkout or outputs.
    const preload = start([
      '--filter',
      'preload',
      'exec',
      'cross-env',
      'NODE_ENV=development',
      'rspack',
      'build',
    ]);
    expect(await new Promise<number | null>((resolve) => preload.once('exit', resolve))).toBe(0);
    main = start([
      'start:main',
      `--user-data-dir=${path.join(copy, 'user-data')}`,
      `--remote-debugging-port=${debuggingPort}`,
      '--remote-debugging-address=127.0.0.1',
    ]);
    await expect
      .poll(
        async () => {
          try {
            return (await fetch(`http://127.0.0.1:${debuggingPort}/json/version`)).status;
          } catch {
            return 0;
          }
        },
        { timeout: 60_000 }
      )
      .toBe(200);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${debuggingPort}`);
    const page = browser
      .contexts()[0]
      .pages()
      .find((page) => page.url().includes('home.html'))!;
    await expect(page.locator('.home__title')).toHaveText('Electron React Rspack');
    expect(new URL(page.url()).port).toBe(String(port));
    await page.evaluate(() => {
      (window as Window & { hmrMarker?: string }).hmrMarker = 'same-document';
    });
    const style = path.join(copy, 'src/renderer/components/Home/index.less');
    fs.appendFileSync(style, '\n.home { --regression-hmr: received; }\n');
    await expect
      .poll(() =>
        page
          .locator('.home')
          .evaluate((el) => getComputedStyle(el).getPropertyValue('--regression-hmr').trim())
      )
      .toBe('received');
    expect(await page.evaluate(() => (window as Window & { hmrMarker?: string }).hmrMarker)).toBe(
      'same-document'
    );
    await page.evaluate(async () => {
      await window.__ELECTRON__.ipcRenderer.invoke('SetUserStore', 'hmr-copy-probe', 'ok');
    });
    await page.evaluate(() => window.__ELECTRON__.ipcRenderer.send('Quit')).catch(() => undefined);
    await expect.poll(() => main!.exitCode).toBe(0);
  } finally {
    await browser?.close().catch(() => undefined);
    stop(main);
    stop(renderer);
    await testInfo.attach('isolated-readme-commands', {
      body: logs.join(''),
      contentType: 'text/plain',
    });
    fs.rmSync(copy, { recursive: true, force: true });
  }
});
