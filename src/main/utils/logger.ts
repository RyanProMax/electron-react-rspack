import log from 'electron-log/main';
import path from 'path';
import dayjs from 'dayjs';

log.transports.file.resolvePathFn = (variables) =>
  path.join(
    variables.libraryDefaultDir,
    `${dayjs().format('YYYY-MM-DD')}`
  );

log.initialize({ preload: true });

export const logger = log;
