import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Warning: This allows production builds to succeed even if
    // your project has type errors. Useful for rapid prototyping.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;