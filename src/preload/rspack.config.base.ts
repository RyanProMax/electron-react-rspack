import { Configuration } from '@rspack/cli';
import path from 'path';

const baseConfiguration: Configuration = {
  target: 'electron-preload',
  entry: {
    preload: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.join(process.cwd(), 'build'),
    filename: 'preload.js',
  },
};

export default baseConfiguration;
