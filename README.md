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

`test:unit` covers URL/sender validation, IPC/updater cleanup, window closing/reopening and build paths/entries. Electron services and updater operations are stubbed.

`test:e2e` runs six Playwright Electron smoke tests against the production build. Build first; no separate Playwright browser installation is required. It verifies launch/home, theme, store/preload, About close cancellation/reopening and styles, and external-link source/navigation/popup behavior. Updates are disabled, shell/dialog calls are stubbed, and each launch uses temporary user data.

For development smoke, keep `start:renderer` running and execute:

```bash
pnpm exec cross-env E2E_DEV=1 pnpm test:e2e
```

The same suite also checks that the dev server's browser-editor endpoint returns 404. On a headless Linux host, use `xvfb-run --auto-servernum pnpm test:e2e`. PR CI runs lint, build, source typecheck, unit tests and production Electron smoke on macOS, Windows and Linux. Development smoke is a separate local check.

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

Signed installers, real update downloads/installation and release publishing are not covered by the smoke suite. To prevent startup update checks during local UI work, set `ELECTRON_SKIP_UPDATE=1` in the environment.

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
