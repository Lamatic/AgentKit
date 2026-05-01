/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lamatic.ai'],
  },
  env: {
    LAMATIC_API_URL: process.env.LAMATIC_API_URL,
  },
}

module.exports = nextConfig