import { Configuration } from '@rspack/cli';
import path from 'path';

const configuration: Configuration = {
  mode: 'development',
  target: 'electron-preload',
  entry: {
    preload: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'preload.js',
  },
};

export default configuration;
