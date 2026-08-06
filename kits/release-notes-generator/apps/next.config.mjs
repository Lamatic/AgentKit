/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow importing kit metadata (lamatic.config.ts) from outside apps/.
  experimental: {
    externalDir: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
