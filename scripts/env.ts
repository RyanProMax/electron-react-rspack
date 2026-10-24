import dotenv from 'dotenv';
import path from 'node:path';

// Both this source directory and the bundled main output (build/) sit directly
// below the repository/app root. Initialize before importing common/env.
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });
