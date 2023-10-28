## Electron + React + Rspack

An Electron boilerplate including TypeScript, React, Rspack and ESLint.

> Reference [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

![ElectronReactRspack](https://github.com/RyanProMax/image-hub/blob/main/electron-react-rspack/03.png)

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

- [x] typescript
- [x] rspack
- [x] electron-store: local persistent storage.
- [x] electron-log
- [x] electron-builder
- [x] electron-updater: auto update app version.
- [x] eslint
- [x] less
- [x] [arco-design](https://github.com/arco-design/arco-design): a comprehensive React UI components library.
- [x] theme: light/dark mode.
- [x] CI/CD: auto build and release when push tag.

## License

[MIT](https://choosealicense.com/licenses/mit/) © [Ryan](https://github.com/RyanProMax)
