/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["alasql"],
  // The demo scenario is staged into ./assets by the build script (see
  // tools/copy-scenario-assets.mjs) so everything traced lives inside
  // the app dir. Widening `outputFileTracingRoot` to the kit dir instead
  // makes Vercel treat that as the deployment root, which breaks its
  // resolution of `next` itself during "Collecting build traces".
  //
  // Tracing is per-route: every route calling loadScenario() needs its
  // own entry, or it resolves locally (files on disk) and 500s only once
  // deployed.
  outputFileTracingIncludes: {
    "/api/investigate": ["./assets/sample-scenario/**"],
    "/api/scenario": ["./assets/sample-scenario/**"],
  },
}

export default nextConfig
