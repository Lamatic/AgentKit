import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Pin the workspace root to this app so a stray lockfile elsewhere on the
  // machine isn't inferred as the root.
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
