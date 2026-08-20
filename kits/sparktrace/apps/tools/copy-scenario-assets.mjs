/**
 * Copy the bundled demo scenario into the app directory before building.
 *
 * The canonical copy lives at kits/sparktrace/assets/sample-scenario —
 * kit level, because the flows and docs reference it too. But Next's
 * output file tracing only reliably follows files inside the app dir on
 * a hosted build: pointing `outputFileTracingRoot` at the parent makes
 * Vercel treat the kit dir as the deployment root and it then fails to
 * resolve `next` itself ("Cannot find module next/dist/compiled/
 * next-server/server.runtime.prod.js").
 *
 * So the assets are copied in, and lib/demo/scenario-paths.ts finds them
 * via its `process.cwd()/assets/sample-scenario` candidate. The copy is
 * generated and gitignored; the kit-level directory stays the source of
 * truth.
 */

import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, "..", "..", "assets", "sample-scenario");
const destination = path.join(here, "..", "assets", "sample-scenario");

if (existsSync(source)) {
  cpSync(source, destination, { recursive: true });
  console.log(`[sparktrace] copied sample-scenario -> ${path.relative(path.join(here, ".."), destination)}`);
} else if (existsSync(destination)) {
  // Already staged (e.g. a rebuild in a tree where only apps/ shipped).
  console.log("[sparktrace] sample-scenario already present, skipping copy");
} else {
  console.error(`[sparktrace] sample-scenario not found at ${source} — demo mode will fail at runtime.`);
  process.exit(1);
}
