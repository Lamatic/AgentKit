import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["alasql"],
  // The bundled demo scenario (assets/sample-scenario/) lives one level
  // above this `apps` app dir, outside Next's default output file tracing
  // scope (the `apps` dir itself). Widen the tracing root to the kit dir
  // (one level up) so the include below can actually resolve and be
  // bundled into the standalone/server output. Without this, `next build`
  // can omit it from server deployments and demo mode breaks at runtime.
  // See lib/demo/scenario-paths.ts.
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Every route that calls loadScenario() needs the assets traced into
  // its own bundle — tracing is per-route, so a route missing from this
  // map works locally (the files are simply on disk) and 500s only once
  // deployed.
  outputFileTracingIncludes: {
    "/api/investigate": ["../assets/sample-scenario/**"],
    "/api/scenario": ["../assets/sample-scenario/**"],
  },
}

export default nextConfig
