/* eslint-disable @typescript-eslint/no-require-imports -- Load main modules after native/service stubs. */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, test } from 'node:test';
import type { UpdateInfo } from 'electron-updater';
import { Channels, Pages } from '../src/common/constant';

// Replace native/service boundaries before requiring the actual main modules.
function stubModule(name: string, exports: unknown) {
  const id = require.resolve(name);
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
}
class Contents extends EventEmitter {
  id = 100 + FakeWindow.instances.length;
  url = '';
  destroyed = false;
  mainFrame = { url: '', detached: false };
  messages: unknown[][] = [];
  windowOpen?: (details: { url: string }) => { action: string };
  getURL() {
    return this.url;
  }
  isDestroyed() {
    return this.destroyed;
  }
  send(...args: unknown[]) {
    this.messages.push(args);
  }
  setWindowOpenHandler(handler: Contents['windowOpen']) {
    this.windowOpen = handler;
  }
}
class FakeWindow extends EventEmitter {
  static instances: FakeWindow[] = [];
  static rejectLoad = false;
  static beforeCreate?: () => void;
  webContents = new Contents();
  id = FakeWindow.instances.length + 1;
  destroyed = false;
  shown = 0;
  focused = 0;
  closable = true;
  minimizable = true;
  maximizable = true;
  maximized = false;
  minimized = false;
  constructor(readonly options: unknown) {
    super();
    FakeWindow.beforeCreate?.();
    FakeWindow.instances.push(this);
  }
  async loadURL(url: string) {
    if (FakeWindow.rejectLoad) throw new Error('load failed');
    this.webContents.url = this.webContents.mainFrame.url = url;
    queueMicrotask(() => {
      if (this.destroyed) return;
      this.webContents.emit('did-finish-load');
      this.emit('ready-to-show');
    });
  }
  isDestroyed() {
    return this.destroyed;
  }
  show() {
    this.shown++;
  }
  focus() {
    this.focused++;
  }
  minimize() {
    this.minimized = true;
  }
  maximize() {
    this.maximized = true;
  }
  unmaximize() {
    this.maximized = false;
  }
  isMaximized() {
    return this.maximized;
  }
  close() {
    const event = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    this.emit('close', event);
    if (!event.defaultPrevented) this.destroy();
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = this.webContents.destroyed = true;
    this.emit('closed');
    this.removeAllListeners();
    this.webContents.removeAllListeners();
  }
}
const handlers = new Map<string, (...args: unknown[]) => unknown>();
const ipcMain = Object.assign(new EventEmitter(), {
  handle(channel: string, callback: (...args: unknown[]) => unknown) {
    assert.equal(handlers.has(channel), false, `duplicate ${channel}`);
    handlers.set(channel, callback);
  },
  removeHandler(channel: string) {
    handlers.delete(channel);
  },
});
let quitCalls = 0;
const app = Object.assign(new EventEmitter(), {
  whenReady: async () => undefined,
  quit: () => {
    quitCalls++;
  },
  getPath: () => '/tmp',
  isPackaged: false,
});
let checks = 0;
let check: () => Promise<unknown>;
let download: (token: { cancelled: boolean }) => Promise<unknown>;
let installs = 0;
const updater = Object.assign(new EventEmitter(), {
  checkForUpdates: () => {
    checks++;
    return check();
  },
  downloadUpdate: (token: { cancelled: boolean }) => download(token),
  quitAndInstall: () => {
    installs++;
  },
});
const shellCalls: unknown[][] = [];
stubModule('electron', {
  app,
  ipcMain,
  BrowserWindow: FakeWindow,
  shell: {
    openExternal: async (...args: unknown[]) => {
      shellCalls.push(args);
    },
  },
});
stubModule('electron-updater', {
  autoUpdater: updater,
  CancellationToken: class {
    cancelled = false;
    cancel() {
      this.cancelled = true;
    }
  },
});
stubModule(
  'electron-store',
  class {
    data = new Map();
    get(key: string) {
      return this.data.get(key);
    }
    set(key: string, value: unknown) {
      this.data.set(key, value);
    }
  }
);
const logger = {
  info() {},
  error() {},
  scope() {
    return logger;
  },
};
stubModule('../src/main/logger', { logger });
const { default: Core } = require('../src/main/core') as typeof import('../src/main/core');
const { default: Main } =
  require('../src/main/windows/main') as typeof import('../src/main/windows/main');
const { default: Update } =
  require('../src/main/windows/update') as typeof import('../src/main/windows/update');
const { default: Cleanup } =
  require('../src/main/lifecycle') as typeof import('../src/main/lifecycle');
const { getHtmlPath } = require('../src/main/utils') as typeof import('../src/main/utils');
const info: UpdateInfo = { version: '1.0.0', files: [], releaseDate: '', path: '', sha512: '' };
const disposables: { dispose(): void }[] = [];
function own<T extends { dispose(): void }>(module: T) {
  disposables.push(module);
  return module;
}
function event(window: FakeWindow) {
  return { sender: window.webContents, senderFrame: window.webContents.mainFrame };
}
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

beforeEach(() => {
  process.env.ELECTRON_SKIP_UPDATE = '1';
  checks = installs = quitCalls = 0;
  shellCalls.length = 0;
  check = async () => {
    updater.emit('update-not-available', info);
  };
  download = async () => undefined;
  FakeWindow.rejectLoad = false;
  FakeWindow.beforeCreate = undefined;
});
afterEach(() => {
  for (const module of disposables.splice(0).reverse()) module.dispose();
  assert.equal(handlers.size, 0);
  assert.equal(ipcMain.eventNames().length, 0);
  assert.equal(app.eventNames().length, 0);
  assert.equal(updater.eventNames().length, 0);
  for (const window of FakeWindow.instances.splice(0)) window.destroy();
});

test('cleanup is idempotent and only removes subscriptions owned by the module', () => {
  const cleanup = own(new Cleanup());
  const emitter = new EventEmitter();
  let calls = 0;
  const other = () => {
    calls++;
  };
  emitter.on('event', other);
  cleanup.on(emitter, 'event', () => {
    calls += 10;
  });
  cleanup.dispose();
  cleanup.dispose();
  emitter.emit('event');
  cleanup.add(() => {
    calls += 100;
  });
  assert.equal(calls, 101);
  assert.equal(emitter.listenerCount('event'), 1);
});

test('window constructor has no side effects and cancelled close retains the same window', async () => {
  const main = own(new Main());
  assert.equal(FakeWindow.instances.length, 0);
  const window = main.createWindow() as unknown as FakeWindow;
  window.once('close', (event) => event.preventDefault());
  window.close();
  assert.equal(main.browserWindow, window);
  assert.equal(main.createWindow(), window);
  assert.equal(FakeWindow.instances.length, 1);
  window.close();
  assert.equal(main.browserWindow, null);
  const reopened = main.createWindow();
  assert.notEqual(reopened, window);
  await tick();
});

test('failed window load is caught and destroys the unusable window', async () => {
  const main = own(new Main());
  FakeWindow.rejectLoad = true;
  main.createWindow();
  await tick();
  assert.equal(main.browserWindow, null);
  assert.equal(FakeWindow.instances[0].destroyed, true);
});

test('Core startup is idempotent, IPC precedes windows and Quit retains its owner', async () => {
  const core = own(new Core());
  assert.equal(FakeWindow.instances.length, 0);
  assert.equal(core.startApp(), core.startApp());
  await core.startApp();
  core.windows!.start();
  assert.equal(FakeWindow.instances.length, 1);
  assert.equal(ipcMain.listenerCount(Channels.Quit), 1);
  const home = FakeWindow.instances[0];
  ipcMain.emit(Channels.Quit, event(home));
  assert.equal(quitCalls, 1);
  assert.equal(handlers.get(Channels.SetUserStore)!(event(home), 'probe', 'ok'), undefined);
  assert.equal(handlers.get(Channels.GetUserStore)!(event(home), 'probe'), 'ok');
  assert.throws(() => handlers.get(Channels.GetUserStore)!({}, 'probe'), /Untrusted/);
  core.dispose();
  core.dispose();
  await core.startApp();
  assert.equal(FakeWindow.instances.length, 1);
});

test('Close compares actual webContents, About reopens, and activate does not restart updater', async () => {
  delete process.env.ELECTRON_SKIP_UPDATE;
  const core = own(new Core());
  await core.startApp();
  await tick();
  const home = FakeWindow.instances[0];
  assert.notEqual(home.id, home.webContents.id);
  ipcMain.emit(Channels.AboutMe, event(home));
  const about = FakeWindow.instances[1];
  ipcMain.emit(Channels.Close, event(about));
  assert.equal(about.destroyed, true);
  assert.equal(quitCalls, 0);
  ipcMain.emit(Channels.AboutMe, event(home));
  assert.equal(FakeWindow.instances.length, 3);
  ipcMain.emit(Channels.Close, event(home));
  assert.equal(quitCalls, 1);
  home.destroy();
  app.emit('activate');
  await tick();
  assert.equal(FakeWindow.instances.length, 4);
  assert.equal(checks, 1);
  assert.equal(ipcMain.listenerCount(Channels.AboutMe), 1);
});

test('IPC ignores unmanaged webContents, subframes and navigated app windows', async () => {
  const core = own(new Core());
  await core.startApp();
  const home = FakeWindow.instances[0];
  const invalid = [
    { sender: { ...home.webContents }, senderFrame: home.webContents.mainFrame },
    { sender: home.webContents, senderFrame: { ...home.webContents.mainFrame } },
    { sender: home.webContents, senderFrame: null },
  ];
  for (const source of invalid) {
    ipcMain.emit(Channels.OpenExternal, source, 'https://example.com');
    ipcMain.emit(Channels.Close, source);
    ipcMain.emit(Channels.AboutMe, source);
  }
  home.webContents.url = 'https://evil.test';
  ipcMain.emit(Channels.OpenExternal, event(home), 'https://example.com');
  await tick();
  assert.equal(quitCalls, 0);
  assert.equal(FakeWindow.instances.length, 1);
  assert.equal(shellCalls.length, 0);
});

test('IPC, navigation and new-window handlers share the external policy and deny popups', async () => {
  const core = own(new Core());
  await core.startApp();
  const home = FakeWindow.instances[0];
  ipcMain.emit(Channels.OpenExternal, event(home), 'https://example.com/ipc');
  ipcMain.emit(Channels.OpenExternal, event(home), 'file:///tmp/file');
  ipcMain.emit(Channels.OpenExternal, event(home), 'https://example.com/options', {
    workingDirectory: '/tmp',
  });
  let prevented = 0;
  for (const url of ['https://example.com/nav', 'javascript:alert(1)']) {
    home.webContents.emit(
      'will-navigate',
      {
        preventDefault() {
          prevented++;
        },
      },
      url
    );
  }
  assert.deepEqual(home.webContents.windowOpen!({ url: 'https://example.com/popup' }), {
    action: 'deny',
  });
  assert.deepEqual(home.webContents.windowOpen!({ url: 'file:///tmp/file' }), { action: 'deny' });
  await tick();
  assert.equal(prevented, 2);
  assert.deepEqual(
    shellCalls.map(([url]) => url),
    ['https://example.com/ipc', 'https://example.com/nav', 'https://example.com/popup']
  );
});

test('update confirmation ignores other windows and settles false when closed', async () => {
  const update = own(new Update());
  const confirmation = update.updateConfirm(info);
  const window = FakeWindow.instances[0];
  ipcMain.emit(Channels.AppUpdaterConfirm, { sender: {}, senderFrame: null }, true);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterConfirm), 1);
  window.close();
  assert.equal(await confirmation, false);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterConfirm), 0);
});

test('dispose settles pending checks and confirmations and removes timers/listeners', async () => {
  const update = own(new Update());
  check = () => new Promise(() => {});
  const checking = update.checkAvailableVersion();
  const confirmation = update.updateConfirm(info);
  update.dispose();
  assert.deepEqual(await checking, { result: false });
  assert.equal(await confirmation, false);
  assert.equal(await update.updateConfirm(info), false);
});

test('update check rejection and timeout both settle and release temporary listeners', async (context) => {
  const update = own(new Update());
  check = async () => {
    throw new Error('offline');
  };
  assert.deepEqual(await update.checkAvailableVersion(), { result: false });
  assert.equal(updater.eventNames().length, 0);
  context.mock.timers.enable({ apis: ['setTimeout'] });
  check = () => new Promise(() => {});
  const pending = update.checkAvailableVersion();
  context.mock.timers.tick(10_000);
  assert.deepEqual(await pending, { result: false });
});

test('download rejection is caught and closes the update window', async () => {
  delete process.env.ELECTRON_SKIP_UPDATE;
  check = async () => {
    updater.emit('update-available', info);
  };
  download = async () => {
    throw new Error('download failed');
  };
  const update = own(new Update());
  update.start();
  await tick();
  const running = update.checkUpdate();
  const window = FakeWindow.instances[0];
  ipcMain.emit(Channels.AppUpdaterConfirm, event(window), true);
  await running;
  assert.equal(window.destroyed, true);
  assert.equal(installs, 0);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterAbort), 0);
});

test('closing a downloading window cancels the token and releases subscriptions', async () => {
  delete process.env.ELECTRON_SKIP_UPDATE;
  check = async () => {
    updater.emit('update-available', info);
  };
  let token: { cancelled: boolean } | undefined;
  let finish: () => void = () => {};
  download = (value) => {
    token = value;
    return new Promise<void>((resolve) => {
      finish = resolve;
    });
  };
  const update = own(new Update());
  update.start();
  await tick();
  const running = update.checkUpdate();
  const window = FakeWindow.instances[0];
  ipcMain.emit(Channels.AppUpdaterConfirm, event(window), true);
  await tick();
  window.close();
  assert.equal(token?.cancelled, true);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterAbort), 0);
  assert.equal(updater.listenerCount('download-progress'), 0);
  updater.emit('update-downloaded');
  assert.equal(installs, 0);
  finish();
  await running;
});

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

async function beginDownload() {
  delete process.env.ELECTRON_SKIP_UPDATE;
  check = async () => {
    updater.emit('checking-for-update');
    updater.emit('update-available', info);
  };
  const pending = deferred();
  let token: { cancelled: boolean } | undefined;
  download = (value) => {
    token = value;
    return pending.promise;
  };
  const update = own(new Update());
  update.start();
  update.start();
  const running = update.checkUpdate();
  await tick();
  const window = FakeWindow.instances[0];
  ipcMain.emit(Channels.AppUpdaterConfirm, event(window), true);
  await tick();
  return { update, running, window, pending, token: token! };
}

test('updater success forwards render/progress, installs once and releases download listeners', async () => {
  const { update, running, window, pending } = await beginDownload();
  assert.equal(checks, 1);
  assert.deepEqual(window.webContents.messages[0], [Channels.Render, info]);
  const progress = { percent: 55, transferred: 55, total: 100, bytesPerSecond: 50 };
  updater.emit('download-progress', progress);
  assert.deepEqual(window.webContents.messages.at(-1), [Channels.AppUpdaterProgress, progress]);
  updater.emit('update-downloaded', info);
  updater.emit('update-downloaded', info);
  assert.equal(installs, 1);
  assert.equal(updater.listenerCount('download-progress'), 0);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterAbort), 0);
  pending.resolve();
  await running;
  update.dispose();
  update.dispose();
  updater.emit('update-downloaded', info);
  assert.equal(installs, 1);
});

test('Abort IPC rejects another window/subframe and directly cancels the active download', async () => {
  const { running, window, token, pending } = await beginDownload();
  for (const source of [
    { sender: {}, senderFrame: null },
    { ...event(window), senderFrame: { ...window.webContents.mainFrame } },
  ]) {
    ipcMain.emit(Channels.AppUpdaterAbort, source);
    assert.equal(token.cancelled, false);
    assert.equal(window.destroyed, false);
  }
  ipcMain.emit(Channels.AppUpdaterAbort, event(window));
  assert.equal(token.cancelled, true);
  assert.equal(window.destroyed, true);
  updater.emit('download-progress', { percent: 99 });
  updater.emit('update-downloaded', info);
  assert.equal(installs, 0);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterAbort), 0);
  pending.resolve();
  await running;
});

test('confirmation validates boolean payloads and explicit false does not download', async () => {
  delete process.env.ELECTRON_SKIP_UPDATE;
  check = async () => {
    updater.emit('update-available', info);
  };
  let downloads = 0;
  download = async () => {
    downloads++;
  };
  const update = own(new Update());
  update.start();
  const running = update.checkUpdate();
  await tick();
  const window = FakeWindow.instances[0];
  for (const option of ['true', {}, null, 1])
    ipcMain.emit(Channels.AppUpdaterConfirm, event(window), option);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterConfirm), 1);
  assert.equal(window.destroyed, false);
  ipcMain.emit(Channels.AppUpdaterConfirm, event(window), false);
  await running;
  assert.equal(window.destroyed, true);
  assert.equal(downloads, 0);
  assert.equal(installs, 0);
});

test('checking error event settles false; repeated start/dispose and late available cannot reopen', async () => {
  delete process.env.ELECTRON_SKIP_UPDATE;
  const pending = deferred();
  check = () => pending.promise;
  const update = own(new Update());
  update.start();
  update.start();
  const running = update.checkUpdate();
  updater.emit('error', new Error('check event failure'));
  await running;
  assert.equal(checks, 1);
  assert.equal(FakeWindow.instances.length, 0);
  assert.equal(updater.listenerCount('update-available'), 0);
  update.dispose();
  update.dispose();
  update.start();
  updater.emit('update-available', info);
  assert.equal(checks, 1);
  assert.equal(FakeWindow.instances.length, 0);
  pending.resolve();
});

test('download error event plus rejection cleans up; dispose wins against late completion', async () => {
  const { update, running, pending, token, window } = await beginDownload();
  updater.emit('error', new Error('transport event failure'));
  update.dispose();
  update.dispose();
  assert.equal(token.cancelled, true);
  assert.equal(window.destroyed, true);
  updater.emit('update-downloaded', info);
  pending.reject(new Error('cancelled transport'));
  await running;
  assert.equal(installs, 0);
  assert.equal(updater.eventNames().length, 0);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterAbort), 0);
});

test('completion winning the race installs once; subsequent abort/dispose is harmless', async () => {
  const { update, running, window, pending } = await beginDownload();
  updater.emit('update-downloaded', info);
  ipcMain.emit(Channels.AppUpdaterAbort, event(window));
  update.dispose();
  pending.resolve();
  await running;
  assert.equal(installs, 1);
});

test('main window controls toggle maximize/minimize and reject wrong source', async () => {
  const core = own(new Core());
  await core.startApp();
  const window = FakeWindow.instances[0];
  ipcMain.emit(Channels.Maximize, { sender: {}, senderFrame: null });
  ipcMain.emit(Channels.Minimize, { sender: {}, senderFrame: null });
  assert.equal(window.maximized, false);
  assert.equal(window.minimized, false);
  ipcMain.emit(Channels.Maximize, event(window));
  assert.equal(window.maximized, true);
  ipcMain.emit(Channels.Maximize, event(window));
  assert.equal(window.maximized, false);
  ipcMain.emit(Channels.Minimize, event(window));
  assert.equal(window.minimized, true);
});

test('theme broadcast accepts only one light/dark value and cannot forward privileged channels', async () => {
  const core = own(new Core());
  await core.startApp();
  const home = FakeWindow.instances[0];
  ipcMain.emit(Channels.AboutMe, event(home));
  await tick();
  const about = FakeWindow.instances[1];
  for (const args of [
    [Channels.Quit],
    [Channels.ToggleTheme, {}],
    [Channels.ToggleTheme, 'invalid'],
    [Channels.ToggleTheme, 'dark', 'extra'],
  ]) {
    ipcMain.emit(Channels.Broadcast, event(home), ...args);
  }
  assert.deepEqual(about.webContents.messages, []);
  ipcMain.emit(Channels.Broadcast, event(home), Channels.ToggleTheme, 'dark');
  assert.deepEqual(about.webContents.messages, [[Channels.ToggleTheme, 'dark']]);
});

test('Store IPC rejects malformed keys even from an authorized renderer', async () => {
  const core = own(new Core());
  await core.startApp();
  const source = event(FakeWindow.instances[0]);
  for (const channel of [Channels.GetUserStore, Channels.SetUserStore]) {
    for (const key of [null, undefined, 0, false, {}, [], '']) {
      assert.throws(() => handlers.get(channel)!(source, key, 'bad'), /non-empty string/);
    }
  }
});

test('all owned IPC is present before the first BrowserWindow constructor runs', async () => {
  let constructions = 0;
  FakeWindow.beforeCreate = () => {
    constructions++;
    for (const channel of [Channels.Quit, Channels.Close, Channels.AboutMe, Channels.OpenExternal])
      assert.equal(ipcMain.listenerCount(channel), 1);
    for (const channel of [Channels.GetPackageJson, Channels.GetUserStore, Channels.SetUserStore])
      assert.equal(handlers.has(channel), true);
  };
  const core = own(new Core());
  await core.startApp();
  assert.equal(constructions, 1);
});

test('failed confirmation load settles false without leaving IPC listeners', async () => {
  const update = own(new Update());
  const confirmed = update.updateConfirm(info);
  FakeWindow.instances[0].webContents.emit('did-fail-load', {}, -105, 'test failure');
  assert.equal(await confirmed, false);
  assert.equal(ipcMain.listenerCount(Channels.AppUpdaterConfirm), 0);
});
