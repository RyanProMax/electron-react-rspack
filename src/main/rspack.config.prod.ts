import { Configuration } from '@rspack/cli';
import path from 'path';

const configuration: Configuration = {
  mode: 'production',
  target: 'electron-main',
  entry: {
    loader: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.join(process.cwd(), 'build'),
    filename: '[name].js',
  }
};

export default configuration;
