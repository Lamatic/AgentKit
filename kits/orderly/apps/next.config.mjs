/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@xenova/transformers", "onnxruntime-node"]
  }
};

export default nextConfig;
