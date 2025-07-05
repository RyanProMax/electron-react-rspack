import { rimrafSync } from 'rimraf';
import fs from 'fs';
import path from 'path';

const foldersToRemove = [path.join(process.cwd(), 'build'), path.join(process.cwd(), 'release')];

foldersToRemove.forEach((folder) => {
  if (fs.existsSync(folder)) rimrafSync(folder);
});
