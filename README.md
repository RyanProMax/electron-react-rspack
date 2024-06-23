## Electron + React + Rspack

An Electron boilerplate including TypeScript, React, Rspack and ESLint.

> Reference [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

![ElectronReactRspack](https://github.com/RyanProMax/image-hub/blob/main/electron-react-rspack/03.png)

![AutoUpdate](https://github.com/RyanProMax/image-hub/blob/main/electron-react-rspack/04.png)

## Installation

Use pnpm in order to install all dependencies.

```bash
pnpm install
```

## Usage

```bash
# use `pnpm start` to start renderer process.
pnpm start

# and use `pnpm start:main` to start main process.
pnpm start:main
```

## Packaging

To generate the project package based on the OS you're running on, just run:

```bash
pnpm package
```

## Features

- [x] **Electron**: v31.0.2
- [x] **Typescript**
- [x] **RSPack**: for electron product (preload and main).
- [x] **RSbuild**: for web product.
- [x] **Electron-Store**: local persistent storage.
- [x] **Electron-Log**: local logger.
- [x] **Electron-Builder**: [have to keep using v24.9.1](https://github.com/electron-userland/electron-builder/issues/8175).
- [x] **Electron-Updater**: auto update app version.
- [x] **Eslint**
- [x] **Less**
- [x] **[Arco-Design](https://github.com/arco-design/arco-design)**: a comprehensive React UI components library.
- [x] **Theme**: light/dark mode.
- [x] **CI/CD**: auto build and release when push tag.

## License

[MIT](https://choosealicense.com/licenses/mit/) © [Ryan](https://github.com/RyanProMax)
