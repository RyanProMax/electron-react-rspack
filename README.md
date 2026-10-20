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

## Packaging

To generate the project package based on the OS you're running on, just run:

```bash
pnpm package:local
```

Artifacts are written to `release/`. This command uses `--publish never`; `pnpm package` is reserved for release publishing.

## Checks

```bash
pnpm lint
pnpm build
pnpm test:e2e
```

`pnpm test:e2e` runs a Playwright Electron smoke suite against the production build (`build/loader.js`). Run `pnpm build` first; the suite does not start the dev server and does not need `playwright install`. It launches the app, checks that the home window renders, toggles dark mode, and reads `app.getAppPath()` plus a user-store round trip through the preload bridge. Auto-update is turned off for the run (`ELECTRON_SKIP_UPDATE=1`), native dialogs are stubbed, and each launch gets its own `userData` directory.

The suite does not cover packaged installers, the real auto-update flow, component-level UI tests, or multi-window permissions. On Linux without a display, run it with `xvfb-run --auto-servernum pnpm test:e2e`.

Pushes to `main` and pull requests run installation, lint, build, and this smoke suite on macOS, Windows, and Linux. The Linux job uses xvfb.

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
