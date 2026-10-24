// Test-only Electron entry. It is bundled separately into an OS-temp directory,
// never imported by the product. Real HTTP, parser, checksum and download code;
// isolated AppAdapter paths plus hard interlocks around every installation API.
import { app, autoUpdater as nativeUpdater } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { MacUpdater, CancellationToken } from 'electron-updater';
import { ElectronHttpExecutor } from 'electron-updater/out/electronHttpExecutor';

export type ProbeState = {
  updater: MacUpdater;
  token: CancellationToken;
  events: { name: string; data?: unknown }[];
  nativeCalls: number;
};
export type ProbeGlobal = typeof globalThis & { updateProbe: ProbeState };

const root = app.getAppPath();
const url = process.env.LOCAL_UPDATE_URL!;
if (!/^http:\/\/127\.0\.0\.1:\d+\/$/.test(url))
  throw new Error('Probe only permits loopback feeds');
const config = path.join(root, 'dev-app-update.yml');
fs.writeFileSync(
  config,
  JSON.stringify({ provider: 'generic', url, updaterCacheDirName: 'download-cache' })
);
app.setPath('userData', path.join(root, 'user-data'));
fs.mkdirSync(app.getPath('userData'), { recursive: true });
const state = { events: [], nativeCalls: 0 } as unknown as ProbeState;
const forbidden = () => {
  state.nativeCalls++;
  throw new Error('Native installation is forbidden in this probe');
};
nativeUpdater.checkForUpdates = forbidden;
nativeUpdater.quitAndInstall = forbidden;
void app.whenReady().then(() => {
  const updater = new MacUpdater(undefined, {
    version: app.getVersion(),
    name: 'LocalUpdateRegression',
    isPackaged: false,
    appUpdateConfigPath: config,
    userDataPath: app.getPath('userData'),
    baseCachePath: path.join(root, 'cache'),
    whenReady: () => app.whenReady(),
    quit: forbidden,
    relaunch: forbidden,
    onQuit: () => {},
  });
  // The custom AppAdapter isolates cache/user paths. Use the same real Electron
  // transport used by the library's default adapter (not a mock network).
  Object.assign(updater, { httpExecutor: new ElectronHttpExecutor() });
  updater.forceDevUpdateConfig = true;
  updater.updateConfigPath = config;
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = false;
  updater.autoRunAppAfterInstall = false;
  updater.disableDifferentialDownload = true;
  updater.quitAndInstall = forbidden;
  updater.logger = { info() {}, warn() {}, error() {}, debug() {} };
  for (const name of [
    'checking-for-update',
    'update-available',
    'update-not-available',
    'download-progress',
    'update-downloaded',
    'update-cancelled',
    'error',
  ] as const) {
    updater.on(name, (data: unknown) =>
      state.events.push({ name, data: data instanceof Error ? data.message : data })
    );
  }
  state.updater = updater;
  state.token = new CancellationToken();
  (globalThis as ProbeGlobal).updateProbe = state;
});
