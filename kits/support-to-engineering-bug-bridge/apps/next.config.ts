import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  // @ts-ignore - Turbopack config structure can vary by minor version, ignoring TS warning to safely apply the runtime fix
  turbopack: {
    root: '../',
  },
};

export default nextConfig;
