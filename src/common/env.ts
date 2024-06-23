import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const isDev = process.env.NODE_ENV === 'development';

export const port = Number(process.env.PORT) || 9527;
