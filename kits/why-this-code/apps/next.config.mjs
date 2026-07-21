import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: join(appDir, ".."),
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
