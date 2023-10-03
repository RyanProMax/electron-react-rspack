import { Configuration } from '@rspack/cli';
import path from 'path';

const configuration: Configuration = {
  mode: 'development',
  entry: {
    preload: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.join(__dirname, 'dll'),
    filename: 'preload.js',
    library: {
      type: 'umd',
    },
  },
};

export default configuration;
