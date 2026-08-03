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
  }
}

export default nextConfig
