import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // No external image sources are currently allowed
    remotePatterns: [],
  },
};

export default nextConfig;
