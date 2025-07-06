import { Configuration } from '@rspack/cli';
import path from 'path';

const configuration: Configuration = {
  mode: 'production',
  target: 'electron-main',
  resolve: {
    tsConfig: path.resolve(process.cwd(), '../../tsconfig.json'),
    extensions: ['.ts', '.js'],
  },
  entry: {
    loader: path.join(__dirname, 'index.ts'),
  },
  output: {
    path: path.join(process.cwd(), '../../build'),
    filename: '[name].js',
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
