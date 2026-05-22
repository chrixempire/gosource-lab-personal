import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const iconDirs = {
  processed: resolve(__dirname, './svgs'),
  raw: resolve(__dirname, './raw'),
} as const;

export const gosourceIconCollections = [
  { prefix: 'gosource', dir: iconDirs.processed },
  { prefix: 'brand', dir: iconDirs.raw },
] as const;
