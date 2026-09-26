import path from "node:path";

const kitRoot = path.resolve(process.cwd(), "..");

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: kitRoot,
  },
};

export default nextConfig;
