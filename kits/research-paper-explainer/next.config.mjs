/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [{ key: 'Connection', value: 'keep-alive' }],
      },
    ];
  },
};
export default nextConfig;
