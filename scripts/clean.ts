import { rimrafSync } from 'rimraf';
import fs from 'fs';
import path from 'path';

const foldersToRemove = [
  path.resolve(__dirname, '../build'),
  path.resolve(__dirname, '../release'),
];

foldersToRemove.forEach((folder) => {
  if (fs.existsSync(folder)) rimrafSync(folder);
});
