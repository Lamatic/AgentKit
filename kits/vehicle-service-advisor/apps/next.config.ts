import type { NextConfig } from "next";
import path from "node:path";

const kitRoot = path.resolve(process.cwd(), "..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: kitRoot,
  },
};

export default nextConfig;
