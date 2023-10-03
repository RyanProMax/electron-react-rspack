import { Configuration } from '@rspack/cli';
import path from 'path';
import fse from 'fs-extra';

import { PAGES } from '../common/constant';
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
        filename: PAGES.MAIN,
        chunks: ['main'],
      },
      {
        template: htmlTemplate,
        filename: PAGES.SUB_PAGE,
        chunks: ['sub'],
      }
    ],
  },
  devServer: {
    port,
    hot: true,
  },
};

export default configuration;
