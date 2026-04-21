import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL(".", import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
