import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lamatic.ai',
      },
    ],
  },
};

export default nextConfig;
