## Electron + React + Rspack

An Electron boilerplate including TypeScript, React, Rspack and ESLint.

> Reference [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

![ElectronReactRspack](https://github.com/RyanProMax/image-hub/blob/main/electron-react-rspack/03.png)

![AutoUpdate](https://github.com/RyanProMax/image-hub/blob/main/electron-react-rspack/04.png)

## Installation

Use Node.js 22.12.0 or later (Node.js 24 is used in CI) and pnpm to install all dependencies.

Electron 44 requires macOS 13 or later and supports 64-bit platforms only.

```bash
pnpm install
```

## Usage

```bash
# use `pnpm start:renderer` to start renderer process.
pnpm start:renderer

# and use `pnpm start:main` to start main process.
pnpm start:main
```

## Packaging

To generate the project package based on the OS you're running on, just run:

```bash
pnpm package
```

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
