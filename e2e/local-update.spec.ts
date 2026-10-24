import { test, expect, _electron as electron, type ElectronApplication } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type { ProbeGlobal } from './update-probe';

// MacUpdater is platform-specific. This suite never invokes native Squirrel.
test.describe('real local-feed MacUpdater transport with installation interlocks', () => {
  test.skip(process.platform !== 'darwin', 'MacUpdater real transport requires macOS');
  let root: string;
  let entry: string;
  test.beforeAll(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'electron-local-update-'));
    entry = path.join(root, 'probe.js');
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'isolated-update-probe', version: '0.0.9', main: 'probe.js' })
    );
    const { rspack } = await import('@rspack/core');
    const compiler = rspack({
      mode: 'development',
      target: 'electron-main',
      entry: path.resolve(__dirname, 'update-probe.ts'),
      resolve: { extensions: ['.ts', '.js'] },
      output: { path: root, filename: 'probe.js' },
      module: {
        rules: [
          {
            test: /\.ts$/,
            loader: 'builtin:swc-loader',
            options: { jsc: { parser: { syntax: 'typescript' } } },
          },
        ],
      },
    });
    await new Promise<void>((resolve, reject) =>
      compiler.run((error, stats) => {
        compiler.close(() => {});
        if (error || stats?.hasErrors()) reject(error || new Error(stats?.toString()));
        else resolve();
      })
    );
  });
  test.afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  for (const scenario of ['success', 'metadata404', 'checksum', 'cancel'] as const) {
    test(`local HTTP ${scenario}: check/download outcome and zero native install calls`, async () => {
      const appDir = fs.mkdtempSync(path.join(root, `${scenario}-`));
      fs.copyFileSync(entry, path.join(appDir, 'probe.js'));
      fs.copyFileSync(path.join(root, 'package.json'), path.join(appDir, 'package.json'));
      const source = path.join(appDir, 'archive');
      fs.mkdirSync(source);
      fs.writeFileSync(path.join(source, 'payload.bin'), crypto.randomBytes(4 * 1024 * 1024));
      const zipName = `fixture-${process.arch}.zip`;
      const zip = path.join(appDir, zipName);
      execFileSync('/usr/bin/ditto', ['-c', '-k', source, zip]);
      const bytes = fs.readFileSync(zip);
      const sha = crypto.createHash('sha512').update(bytes).digest('base64');
      const requests: string[] = [];
      const server = http.createServer((request, response) => {
        const pathname = new URL(request.url!, 'http://127.0.0.1').pathname;
        requests.push(pathname);
        if (pathname.endsWith('.yml')) {
          if (scenario === 'metadata404') {
            response.writeHead(404);
            response.end('missing test metadata');
            return;
          }
          response.end(
            JSON.stringify({
              version: '9.0.0',
              files: [
                {
                  url: zipName,
                  sha512: scenario === 'checksum' ? Buffer.alloc(64).toString('base64') : sha,
                  size: bytes.length,
                },
              ],
              path: zipName,
              sha512: sha,
              releaseDate: '2026-01-01T00:00:00.000Z',
            })
          );
        } else if (pathname === `/${zipName}`) {
          response.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': bytes.length,
          });
          let offset = 0;
          const timer = setInterval(() => {
            if (offset >= bytes.length) {
              clearInterval(timer);
              response.end();
            } else {
              response.write(bytes.subarray(offset, (offset += 64 * 1024)));
            }
          }, 30);
          response.on('close', () => clearInterval(timer));
        } else {
          response.writeHead(404);
          response.end();
        }
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address() as import('node:net').AddressInfo;
      let app: ElectronApplication | undefined;
      try {
        const env: Record<string, string> = Object.fromEntries(
          Object.entries(process.env).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
          )
        );
        env.LOCAL_UPDATE_URL = `http://127.0.0.1:${address.port}/`;
        delete env.ELECTRON_RUN_AS_NODE;
        app = await electron.launch({ args: [appDir], env });
        await expect
          .poll(() => app!.evaluate(() => Boolean((globalThis as ProbeGlobal).updateProbe)))
          .toBe(true);
        const checking = await app.evaluate(async () => {
          try {
            const result = await (globalThis as ProbeGlobal).updateProbe.updater.checkForUpdates();
            return { version: result?.updateInfo.version, error: '' };
          } catch (error) {
            return { error: String(error), version: '' };
          }
        });
        if (scenario === 'metadata404') expect(checking.error).toContain('404');
        else {
          expect(checking.version).toBe('9.0.0');
          const downloading = app.evaluate(async () => {
            const probe = (globalThis as ProbeGlobal).updateProbe;
            try {
              const files = await probe.updater.downloadUpdate(probe.token);
              return { files, error: '' };
            } catch (error) {
              return { files: [], error: String(error) };
            }
          });
          await expect
            .poll(() =>
              app!.evaluate(
                () =>
                  (globalThis as ProbeGlobal).updateProbe.events.filter(
                    (event) => event.name === 'download-progress'
                  ).length
              )
            )
            .toBeGreaterThan(0);
          if (scenario === 'cancel')
            await app.evaluate(() => (globalThis as ProbeGlobal).updateProbe.token.cancel());
          const result = await downloading;
          if (scenario === 'success') {
            expect(result.error).toBe('');
            const downloaded = await app.evaluate(
              () =>
                (globalThis as ProbeGlobal).updateProbe.events.find(
                  (event) => event.name === 'update-downloaded'
                )?.data as { downloadedFile: string }
            );
            expect(downloaded.downloadedFile.startsWith(appDir + path.sep)).toBe(true);
            expect(
              crypto
                .createHash('sha512')
                .update(fs.readFileSync(downloaded.downloadedFile))
                .digest('base64')
            ).toBe(sha);
          } else
            expect(result.error.toLowerCase()).toContain(
              scenario === 'checksum' ? 'sha512' : 'cancel'
            );
        }
        const state = await app.evaluate(() => ({
          events: (globalThis as ProbeGlobal).updateProbe.events,
          calls: (globalThis as ProbeGlobal).updateProbe.nativeCalls,
        }));
        expect(state.calls).toBe(0);
        expect(state.events.some((event) => event.name === 'checking-for-update')).toBe(true);
        if (scenario === 'cancel')
          expect(state.events.some((event) => event.name === 'update-cancelled')).toBe(true);
        if (scenario === 'metadata404' || scenario === 'checksum')
          expect(state.events.some((event) => event.name === 'error')).toBe(true);
        expect(requests.some((request) => request.endsWith('.yml'))).toBe(true);
      } finally {
        await app?.close().catch(() => undefined);
        server.closeAllConnections();
        await new Promise<void>((resolve) => server.close(() => resolve()));
        fs.rmSync(appDir, { recursive: true, force: true });
      }
    });
  }
});
