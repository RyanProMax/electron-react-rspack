# Electron React Rspack

An Electron boilerplate with TypeScript, React, Rspack 2, Arco Design, LESS, Electron Store, logging and update UI.

![ElectronReactRspack](https://github.com/RyanProMax/image-hub/blob/main/electron-react-rspack/03.png)

## Requirements and installation

- Node.js **22.12.0 or later**; CI uses Node.js 24.
- pnpm **10.32.1** (declared in `packageManager`).
- Electron **44.9.3** is locked; macOS 13+ and a supported 64-bit OS are required. React remains 19.1.0.

```bash
npm install --global pnpm@10.32.1
pnpm install --frozen-lockfile
```

Rspack core and CLI are pinned to **2.2.9**. The separately installed dev server is **2.2.1**, and optional build analysis uses **Rsdoctor 2.0.0**. These packages support the Node.js requirement above. The application runtime remains CommonJS; build configuration files use native ESM (`rspack.config.mjs`) without changing the package-wide module type.

## Development

```bash
# Terminal 1: build preload, then start the renderer dev server.
pnpm start:renderer

# Terminal 2: build main, then launch Electron with the built entry.
pnpm start:main
```

The default URL is `http://localhost:9527/home.html`. Set `PORT` in a repository-root `.env` or the process environment to change it. The server binds to localhost. Renderer changes use HMR; restart `start:main` after main-process changes, and restart `start:renderer` after preload changes. The main process does not need a TypeScript loader in `NODE_OPTIONS`.

The browser-to-editor endpoint is disabled because dev-server 2.2.1 vendors an affected launch-editor version. Clicking a browser overlay to open a source file in a native editor is unavailable; page serving and HMR remain enabled. See the [security review](docs/security-audit.md).

## Build and checks

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
```

`build` cleans once and builds all three targets. Outputs are `build/loader.js`, `build/preload.js` and `build/renderer/`; source maps are emitted explicitly. Main/preload share the output directory and do not clean one another's files. Paths resolve relative to the configuration or bundle, so the built app does not require a particular working directory.

`typecheck` checks source, native ESM configs and tests with `skipLibCheck`. The strict command below still reports upstream declaration errors in Arco/React 19, b-validate, electron-updater's semver dependency and resize-observer-polyfill. The source-only check does not mean those upstream declarations pass.

```bash
pnpm exec tsc --noEmit --incremental false
```

`test:unit` has 31 cases covering URL/sender validation, strict Store/theme payloads, IPC registration timing and cleanup, updater success/progress/install-call assertions, direct Abort, failures, races and window/build lifecycle. Electron services and updater operations in these unit tests are stubbed.

`test:e2e` runs the original six smoke cases plus native window/renderer IPC and macOS local-update transport cases. Build first; no separate Playwright browser installation is required. Tests verify preload/Store, Home/About light-dark-light and native screenshots, close/reopen/quit, resize/min-size, minimize/maximize/restore, unmanaged renderers and cross-origin iframe isolation. Native min/max is skipped on Linux xvfb because there is no window manager. User data is temporary, dialogs and external shell opening are stubbed, and product startup update checks are disabled.

The four macOS local-update probes use a separate temporary Electron app and loopback-only HTTP feed. They run the real MacUpdater parser/transport, progress, SHA-512 validation, 404 and cancellation paths, with isolated filesystem paths. Native Squirrel, installation and restart APIs are guarded against invocation. Fixture ZIP download success is **not** signed application installation success. Cross-origin frames have no preload bridge; additional main-side sender checks use a real frame identity with an explicitly synthetic event, without enabling subframe Node integration.

```bash
pnpm test:e2e:dev
```

This starts/reuses the dev server and first rebuilds main in development mode. It also copies source into an OS-temp fixture, invokes the actual `start:renderer` and `start:main` commands, builds preload in development mode, edits only that copy's LESS, and verifies a live style update with the document marker intact. The original checkout and daily app data are not edited by the HMR test. The development suite also verifies the disabled browser-editor URL returns 404.

Visual evidence uses native `webContents.capturePage`, because CDP screenshots can crop Electron content when page zoom is not 100%. Tests wait for theme transitions, capture desktop/minimum/125% zoom states and record display scale factors. Screenshots are evidence for review rather than pixel-baseline tests. The About content region scrolls at constrained zoom; real OS display DPI and multi-monitor behavior require suitable hardware and are not simulated by page zoom.

On a headless Linux host, use `xvfb-run --auto-servernum pnpm test:e2e`. CI runs production checks on macOS, Windows and Linux, and development/HMR plus isolated unsigned package checks on macOS. Screenshots/traces are retained as CI artifacts. `E2E_OUTPUT_DIR` selects a separate test-output directory; optional `E2E_VISUAL_DIR` selects a local screenshot directory.

See [test coverage and boundaries](docs/testing.md) for the distinction between stubbed orchestration, real renderer/native-window behavior, local update transport and signed installation.

## Bundle analysis

```bash
pnpm analyze
# Or analyze one target without cleaning the other outputs:
pnpm --filter renderer run analyze
```

Rspack 2 removed `--analyze`; these commands enable Rsdoctor only for the requested analysis build. Offline HTML and JSON reports are written to `build/analysis/{main,preload,renderer}/rsdoctor-report.html` and `rsdoctor-data.json`. No report server or browser is started. Open the HTML report locally. Reports may contain local paths and build details; they are generated artifacts, ignored by Git and removed by the next clean build. Analysis may report duplicate dependency versions or intentional side-effect imports; these diagnostics are distinct from dependency security advisories. No performance improvement is claimed without a benchmark.

## Packaging

```bash
pnpm package:local
```

This builds and packages for the current OS into `release/` with `--publish never`. Signing credentials and platform-specific packaging prerequisites are separate. `pnpm package` uses `--publish always` and is reserved for an authorized release workflow; running a normal build or test does not publish a release.

For an isolated, non-publishing packaging regression on a Mac:

```bash
pnpm package:smoke
pnpm test:e2e:packaged
```

The smoke package uses the current Mac architecture, a distinct regression app ID/name, `identity: null`, `CSC_IDENTITY_AUTO_DISCOVERY=false` and `--publish never`. Its `.app` and ZIP stay under `release/regression/`; the launcher refuses paths outside that output. Packaged tests cover assets, preload, theme, About, native controls and real macOS LaunchServices reopening of the same isolated test process. This is not a physical Dock-click test or an installation into `/Applications`.

Developer ID signing, notarization, signed installer trust and actual update installation/restart are not validated by an unsigned package or guarded updater probe. No certificates are generated/imported and no system security settings are changed. To prevent startup update checks during other local UI work, set `ELECTRON_SKIP_UPDATE=1`.

## Architecture and migration

- **Main** owns Core/Store/Windows and updater lifecycle. IPC is registered before opening windows; owned listeners, timers and pending confirmations/downloads are disposed. `closed` clears window references, and macOS activation reopens home without restarting the updater. The [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate/blob/main/src/main/main.ts) and [VS Code lifecycle utilities](https://github.com/microsoft/vscode/blob/main/src/vs/base/common/lifecycle.ts) informed these small ownership patterns.
- **Preload** exposes the existing IPC bridge through contextBridge. Main validates its own IPC senders against managed webContents, the current main frame and the exact application document. External links accept HTTP/HTTPS without credentials and only the optional boolean `activate` option. Navigation/popup policy is shared; popups cannot create Electron windows. Default Chromium web security remains enabled.
- **Renderer** has sorted home/about/update entry files. Arco's old unplugin still declares only Rspack 1.x and uses a deprecated API, so it is removed. Official SWC `transformImport` handles Arco components, component LESS styles and icon imports. The existing style-loader/css-loader/less-loader pipeline remains. No alternate UI library or compatibility shim is introduced. The old `removeFontFace` transform had no matching font-face rules in the installed Arco common stylesheet; application fonts remain in the existing asset pipeline.
- **Rspack** retains `electron-main`, `electron-preload` and `web`, explicit source maps, `resolve.tsConfig` and shared output ownership. Native ESM configs and their build helpers are separate from the CommonJS Electron runtime.

See the official [Rspack 1-to-2 migration guide](https://rspack.rs/guide/migration/rspack_1.x), [SWC transformImport](https://rspack.rs/guide/features/builtin-swc-loader#transformimport), [Rsdoctor setup](https://rsdoctor.rs/guide/start/quick-start), and [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

## Security status

The [dependency review](docs/security-audit.md) records the 16 baseline GitHub advisories, dependency paths, compatible fixes, vendored launch-editor mitigation and disputed cache advisory. The updated lockfile currently produces 0 known findings in `pnpm audit`; this does not cover all vendored code or substitute for GitHub code/secret scanning. Default-branch alerts require merge and a GitHub refresh before their status can change. No alerts were manually dismissed. The existing follow-redirects 1.16.1 fix is preserved.

## License

[MIT](https://choosealicense.com/licenses/mit/) © [Ryan](https://github.com/RyanProMax)
