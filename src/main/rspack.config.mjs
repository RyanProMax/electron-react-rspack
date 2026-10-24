// @ts-check
import path from 'node:path';
import { analysisPlugins } from '../../scripts/analysis.mjs';

const configDir = import.meta.dirname;

/** @type {import('@rspack/core').Configuration} */
const configuration = {
  context: path.resolve(configDir, '../..'),
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  devtool: 'source-map',
  plugins: await analysisPlugins('main'),
  target: 'electron-main',
  resolve: {
    tsConfig: path.resolve(configDir, '../../tsconfig.json'),
    extensions: ['.ts', '.js'],
  },
  entry: {
    loader: path.join(configDir, 'index.ts'),
  },
  output: {
    path: path.resolve(configDir, '../../build'),
    filename: '[name].js',
    clean: false, // main and preload share this directory
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
};

export default configuration;
