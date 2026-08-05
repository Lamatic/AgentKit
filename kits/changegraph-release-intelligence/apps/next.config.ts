import { resolve } from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Include both the Next.js app and the kit-level
    // lamatic.config.ts in Turbopack's filesystem root.
    root: resolve(__dirname, ".."),
  },
};

export default nextConfig;