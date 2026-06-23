import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const appDir = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The kit's lamatic.config.ts lives one level above this app directory;
  // widen the Turbopack root so the orchestrate action can import it.
  turbopack: {
    root: join(appDir, ".."),
  },
}

export default nextConfig
