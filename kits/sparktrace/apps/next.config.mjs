/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["alasql"],
  // The bundled demo scenario (assets/sample-scenario/) lives one level
  // above this `apps` app dir, outside Next's default output file tracing
  // scope. Without this, `next build` can omit it from server deployments
  // and demo mode breaks at runtime. See lib/demo/scenario-paths.ts.
  outputFileTracingIncludes: {
    "/api/investigate": ["../assets/sample-scenario/**"],
  },
}

export default nextConfig
