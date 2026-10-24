import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  externalRequest,
  isAppPageURL,
  isAppSender,
  openExternal,
} from '../src/main/windows/external';

test('external URLs accept HTTP(S) and normalize before calling the shell stub', async () => {
  const calls: unknown[][] = [];
  const shell = async (...args: unknown[]) => {
    calls.push(args);
  };
  assert.equal(await openExternal(shell, 'HTTPS://example.com/docs', { activate: false }), true);
  assert.equal(await openExternal(shell, 'http://example.com'), true);
  assert.deepEqual(calls, [
    ['https://example.com/docs', { activate: false }],
    ['http://example.com/', undefined],
  ]);
});

test('malformed URLs, credentials and dangerous protocols never reach the shell', async () => {
  let calls = 0;
  for (const url of [
    null,
    {},
    1,
    '',
    '//example.com',
    'https:example.com',
    'https://',
    'file:///tmp/app',
    'javascript:alert(1)',
    'data:text/html,test',
    'mailto:test@example.com',
    'https://user:pass@example.com',
    'https://user@example.com',
    'https://example.com\\@evil.test',
    ' https://example.com',
    'https://exam\nple.com',
  ]) {
    assert.equal(
      await openExternal(async () => {
        calls++;
      }, url),
      false,
      String(url)
    );
  }
  assert.equal(calls, 0);
});

test('only a boolean activate option is supported', () => {
  assert.ok(externalRequest('https://example.com', {}));
  for (const options of [
    null,
    true,
    [],
    { activate: 'true' },
    { workingDirectory: '/tmp' },
    { logUsage: true },
    { activate: true, extra: true },
  ]) {
    assert.equal(externalRequest('https://example.com', options), null);
  }
});

test('shell rejection is observable by the caller', async () => {
  await assert.rejects(
    openExternal(async () => {
      throw new Error('shell failed');
    }, 'https://example.com'),
    /shell failed/
  );
});

test('application page comparison permits hash routes but rejects origin and path lookalikes', () => {
  const expected = 'http://localhost:9527/home.html';
  assert.equal(isAppPageURL(`${expected}#route`, expected), true);
  for (const actual of [
    `${expected}.evil`,
    `${expected}?other=1`,
    'http://localhost:9528/home.html',
    'http://localhost:9527.evil.test/home.html',
    'http://user@localhost:9527/home.html',
    'file:///home.html',
    'invalid',
  ]) {
    assert.equal(isAppPageURL(actual, expected), false, actual);
  }
  assert.equal(isAppPageURL('file:///app/home.html#route', 'file:///app/home.html'), true);
  assert.equal(isAppPageURL('file:///app/home.html/evil', 'file:///app/home.html'), false);
});

test('sender must be the managed webContents and its live current main frame', () => {
  const url = 'file:///app/home.html';
  const frame = { url, detached: false };
  const contents = { getURL: () => url, isDestroyed: () => false, mainFrame: frame };
  const window = {
    webContents: contents,
    isDestroyed: () => false,
  } as unknown as Electron.BrowserWindow;
  const event = { sender: contents, senderFrame: frame } as unknown as Electron.IpcMainEvent;
  assert.equal(isAppSender(event, window, url), true);
  assert.equal(isAppSender(event, null, url), false);
  assert.equal(
    isAppSender(
      { ...event, sender: { ...contents } } as unknown as Electron.IpcMainEvent,
      window,
      url
    ),
    false
  );
  for (const senderFrame of [null, { ...frame }, { ...frame, url: 'https://evil.test' }]) {
    assert.equal(
      isAppSender({ ...event, senderFrame } as Electron.IpcMainEvent, window, url),
      false
    );
  }
  frame.detached = true;
  assert.equal(isAppSender(event, window, url), false);
  frame.detached = false;
  frame.url = 'file:///app/home.html.evil';
  assert.equal(isAppSender(event, window, url), false);
  frame.url = url;
  contents.getURL = () => 'https://evil.test';
  assert.equal(isAppSender(event, window, url), false);
  contents.getURL = () => url;
  contents.isDestroyed = () => true;
  assert.equal(isAppSender(event, window, url), false);
});
