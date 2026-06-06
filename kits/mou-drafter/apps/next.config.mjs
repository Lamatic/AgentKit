import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const kitDir = resolve(appDir, "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  outputFileTracingRoot: kitDir,
  turbopack: {
    root: kitDir,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
