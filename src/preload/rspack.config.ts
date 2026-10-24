import { Configuration } from '@rspack/core';
import path from 'path';

const configuration: Configuration = {
  context: path.resolve(__dirname, '../..'),
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  devtool: 'source-map',
  target: 'electron-preload',
  resolve: {
    tsConfig: path.resolve(__dirname, '../../tsconfig.json'),
    extensions: ['.ts', '.js'],
  },
  entry: {
    preload: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.resolve(__dirname, '../../build'),
    filename: '[name].js',
    clean: false, // main and preload share this directory
  },
};

export default configuration;
