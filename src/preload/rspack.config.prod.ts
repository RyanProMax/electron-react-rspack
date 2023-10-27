import { Configuration } from '@rspack/cli';
import path from 'path';

const configuration: Configuration = {
  mode: 'production',
  target: 'electron-preload',
  resolve: {
    tsConfigPath: path.resolve(process.cwd(), './tsconfig.json'),
  },
  entry: {
    preload: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.join(process.cwd(), 'build'),
    filename: '[name].js',
  },
};

export default configuration;
