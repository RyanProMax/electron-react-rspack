import { Configuration } from '@rspack/core';
import path from 'path';

const configuration: Configuration = {
  context: path.resolve(__dirname, '../..'),
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  devtool: 'source-map',
  target: 'electron-main',
  resolve: {
    tsConfig: path.resolve(__dirname, '../../tsconfig.json'),
    extensions: ['.ts', '.js'],
  },
  entry: {
    loader: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.resolve(__dirname, '../../build'),
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
