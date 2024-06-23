import { RsbuildConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

import path from 'path';
import fse from 'fs-extra';
import keyBy from 'lodash/keyBy';

import { removeFileExtname } from '../main/utils';
import { port } from '../common/env';

const htmlTemplate = path.join(__dirname, 'template.html');
const entryDir = path.join(__dirname, 'entry');
const files = fse.readdirSync(entryDir);
const entry = keyBy(
  files.map(f => path.join(entryDir, f)),
  filePath => removeFileExtname(filePath)
);

const configuration: RsbuildConfig = {
  html: {
    template: htmlTemplate,
  },
  source: {
    entry,
    tsconfigPath: path.resolve(process.cwd(), '../../tsconfig.json'),
    transformImport: [
      {
        libraryName: '@arco-design/web-react',
        libraryDirectory: 'es',
        camelToDashComponentName: false,
        style: true,
      },
      {
        libraryName: '@arco-design/web-react/icon',
        libraryDirectory: 'react-icon',
        camelToDashComponentName: false,
      },
    ]
  },
  output: {
    targets: ['web'],
    assetPrefix: path.join(process.cwd(), '../../build/renderer'),
    distPath: {
      root: path.join(process.cwd(), '../../build/renderer'),
    },
    // filename: {
    //   js: '[name].js',
    // },
  },
  plugins: [
    pluginReact(),
    pluginSvgr(),
    pluginLess({
      lessLoaderOptions: {
        lessOptions: {
          modifyVars: {
            // custom your primary color
            // 'arcoblue-6': '#37D4CF',
          },
          javascriptEnabled: true,
        }
      }
    }),
  ],
  performance: {
    // chunkSplit: 'split-by-module',
  },
  dev: {
    hmr: true,
  },
  server: {
    port
  }
};

export default configuration;
