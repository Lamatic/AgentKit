import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: appRoot,
  serverExternalPackages: ["sql.js"],
  outputFileTracingIncludes: {
    "/api/tune": [
      "./lib/sql-worker.cjs",
      "./node_modules/sql.js/dist/sql-wasm.js",
      "./node_modules/sql.js/dist/sql-wasm.wasm",
    ],
  },
};

export default nextConfig;
