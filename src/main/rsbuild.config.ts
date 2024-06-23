import { RsbuildConfig } from '@rsbuild/core';
import path from 'path';

const configuration: RsbuildConfig = {
  source: {
    entry: {
      loader: path.join(__dirname, 'index.ts'),
    },
    tsconfigPath: path.resolve(process.cwd(), '../../tsconfig.json'),
  },
  output: {
    targets: ['node'],
    distPath: {
      root: path.join(process.cwd(), '../../build'),
    },
    filename: {
      js: '[name].js',
    },
  }
};

export default configuration;
