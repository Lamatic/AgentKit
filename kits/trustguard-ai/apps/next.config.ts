import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // No external image sources allowed yet; add patterns here if attachment_url previews are needed
    remotePatterns: [],
  },
};

export default nextConfig;
