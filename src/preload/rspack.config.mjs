// @ts-check
import path from 'node:path';
import { analysisPlugins } from '../../scripts/analysis.mjs';

const configDir = import.meta.dirname;

/** @type {import('@rspack/core').Configuration} */
const configuration = {
  context: path.resolve(configDir, '../..'),
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  devtool: 'source-map',
  plugins: await analysisPlugins('preload'),
  target: 'electron-preload',
  resolve: {
    tsConfig: path.resolve(configDir, '../../tsconfig.json'),
    extensions: ['.ts', '.js'],
  },
  entry: {
    preload: path.join(configDir, 'index.ts'),
  },
  output: {
    path: path.resolve(configDir, '../../build'),
    filename: '[name].js',
    clean: false, // main and preload share this directory
  },
};

export default configuration;
