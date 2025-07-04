import { Configuration } from '@rspack/cli';
import path from 'path';

/**
 * TODO: rsbuild cannot build electron product
 * So keep using @rspack/cli as compiler
 */
const configuration: Configuration = {
  mode: 'production',
  target: 'electron-preload',
  resolve: {
    tsConfig: path.resolve(process.cwd(), '../../tsconfig.json'),
  },
  entry: {
    preload: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.join(process.cwd(), '../../build'),
    filename: '[name].js',
  },
};

export default configuration;
