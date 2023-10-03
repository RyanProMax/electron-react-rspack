import { Configuration } from '@rspack/cli';
import path from 'path';
import fse from 'fs-extra';

import { Pages } from '../common/constant';
import { port } from '../common/env';
import { removeFileExtname } from '../common/utils';

const htmlTemplate = path.join(__dirname, 'template.html');

const getEntryPath = () => {
  const entryDir = path.join(__dirname, 'entry');
  const files = fse.readdirSync(entryDir);
  const entry: Record<string, string> = {};

  files.forEach(fileName => {
    entry[removeFileExtname(fileName)] = path.join(entryDir, fileName);
  });

  return entry;
}

const configuration: Configuration = {
  mode: 'development',
  entry: getEntryPath(),
  builtins: {
    html: [
      {
        template: htmlTemplate,
        filename: Pages.Main,
        chunks: ['main'],
      },
      {
        template: htmlTemplate,
        filename: Pages.Sub,
        chunks: ['sub'],
      }
    ],
  },
  module: {
    rules: [
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
    ],
  },
  devServer: {
    port,
    hot: true,
  },
};

export default configuration;
