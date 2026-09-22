/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keeps TS resolution of ../../lamatic.config working from inside apps dir.
  experimental: {
    externalDir: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
