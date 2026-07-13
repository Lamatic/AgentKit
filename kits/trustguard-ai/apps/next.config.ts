import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow any https image source for attachment_url previews if needed
    remotePatterns: [],
  },
};

export default nextConfig;
