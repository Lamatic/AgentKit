/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Fail builds on typescript errors
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["../../lamatic.config.ts"],
}

export default nextConfig
