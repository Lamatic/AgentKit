import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // This kit folder has its own lockfile; pin Turbopack root so Next doesn't pick a parent lockfile.
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
