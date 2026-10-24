## Electron + React + Rspack

An Electron boilerplate including TypeScript, React, Rspack and ESLint.

> Reference [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

![ElectronReactRspack](https://github.com/RyanProMax/image-hub/blob/main/electron-react-rspack/03.png)

![AutoUpdate](https://github.com/RyanProMax/image-hub/blob/main/electron-react-rspack/04.png)

## Installation

Use Node.js 22.12.0 or later (Node.js 24 is used in CI) and pnpm 10.32.1 to install all dependencies.

Electron 44 requires macOS 13 or later and supports 64-bit platforms only.

```bash
npm install --global pnpm@10.32.1
pnpm install --frozen-lockfile
```

## Usage

```bash
# In the first terminal, start the renderer and wait for compilation to finish.
pnpm start:renderer

# In a second terminal, start the Electron main process.
pnpm start:main
```

`start:main` builds main first and launches `build/loader.js`; Electron no longer needs a TypeScript loader in `NODE_OPTIONS`. Restart this command after main-process changes. The renderer uses HMR; preload is built when starting the renderer server. Build and runtime paths resolve relative to their own files, so launching the built app does not require `src/main` as the working directory.

## Packaging

To generate the project package based on the OS you're running on, just run:

```bash
pnpm package:local
```

Artifacts are written to `release/`. This command uses `--publish never`; `pnpm package` is reserved for release publishing.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
```

`pnpm typecheck` checks source and tests with `skipLibCheck`; a strict `pnpm exec tsc --noEmit --incremental false` still reports existing upstream declaration issues in Arco/React 19, b-validate, electron-updater and resize-observer-polyfill. This change does not upgrade those dependencies.

`pnpm test:unit` covers external URL and sender validation, lifecycle ownership, window close/reopen behavior, updater failure/cancellation and build configuration. Native services and updater operations are stubbed.

`pnpm test:e2e` runs a Playwright Electron smoke suite against the production build (`build/loader.js`). Run `pnpm build` first; the suite does not start the dev server and does not need `playwright install`. It retains the original four launch/home/theme/store checks and adds About close/reopen/theme/style behavior and external-link sender/navigation/popup checks. Shell calls are stubbed, auto-update is turned off (`ELECTRON_SKIP_UPDATE=1`), native dialogs are stubbed, and each launch gets its own `userData` directory. With `pnpm start:renderer` running, use `pnpm exec cross-env E2E_DEV=1 pnpm test:e2e` to exercise the same suite against the dev server.

The suite does not cover signed installers or real update downloads/installation. On Linux without a display, run it with `xvfb-run --auto-servernum pnpm test:e2e`.

Pushes to `main` and pull requests run installation, lint, source typecheck, unit tests, build, and this smoke suite on macOS, Windows, and Linux. The Linux job uses xvfb.

## Main-process and build decisions

External links accept only valid HTTP/HTTPS URLs without credentials. Only the optional boolean `activate` option is forwarded. IPC must come from a managed window's current main frame on its exact application document (hash routes are allowed). Navigation and popups use the same URL policy; popups never create an Electron window. Default Chromium web security remains enabled.

Core, Store, Windows and updater subscriptions have explicit owners and disposal. IPC is registered before creating windows; window references are cleared on `closed`, and macOS activation reopens a window without restarting the updater. This follows the small ownership patterns in [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate/blob/main/src/main/main.ts) and [VS Code lifecycle utilities](https://github.com/microsoft/vscode/blob/main/src/vs/base/common/lifecycle.ts), without introducing a container or copying their frameworks. Sender validation follows [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

Rspack stays on the locked 1.x toolchain. The [three targets](https://v1.rspack.rs/config/target), [resolve.tsConfig](https://v1.rspack.rs/config/resolve#resolvetsconfig), Arco plugin and LESS/CSS loaders are preserved. Main and preload emit source maps and share `build/` without cleaning each other's files. Renderer entries are sorted source files; directories, declarations and unrelated files are excluded. Rspack 2.x migration remains deferred: the installed Arco plugin only declares 1.x peer support and still uses `rspackExperiments.import`. A previous 2.2.9 build experiment is not a compatibility guarantee or validation of this change.

## Features

- [x] **Electron**: v44.4.5
- [x] **Typescript**
- [x] **RSPack**: for electron product (preload, main, renderer)
- [x] **Electron-Store**: local persistent storage
- [x] **Electron-Log**: local logger
- [x] **Electron-Builder**: v26.15.3
- [x] **Electron-Updater**: auto update app version
- [x] **ESLint & Prettier**
- [x] **Less**
- [x] **[Arco-Design](https://github.com/arco-design/arco-design)**: a comprehensive React UI components library
- [x] **Theme**: light/dark mode
- [x] **CI/CD**: auto build and release when push tag

## License

[MIT](https://choosealicense.com/licenses/mit/) © [Ryan](https://github.com/RyanProMax)
