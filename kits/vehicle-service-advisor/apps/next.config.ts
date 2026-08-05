import type { NextConfig } from "next";
import path from "node:path";

const kitRoot = path.resolve(process.cwd(), "..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: kitRoot,
  turbopack: {
    root: kitRoot,
  },
};

export default nextConfig;
