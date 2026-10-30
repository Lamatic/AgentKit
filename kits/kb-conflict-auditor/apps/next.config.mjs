import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kitRoot = path.resolve(__dirname, '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: kitRoot,
  turbopack: {
    root: kitRoot,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
