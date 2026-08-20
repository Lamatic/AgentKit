/**
 * SparkTrace demo mode — shared helpers for locating and loading the
 * bundled sample scenario (assets/sample-scenario/). Used by
 * demo-catalog.ts, demo-ingestor.ts, and demo-executor.ts so all three
 * agree on exactly one on-disk source of truth.
 */

import fs from "node:fs";
import path from "node:path";

export interface ScenarioColumn {
  name: string;
  type: string;
}

export interface ScenarioTable {
  database: string;
  name: string;
  kind: "source" | "sink" | "intermediate";
  columns?: ScenarioColumn[];
  location?: string;
}

export interface ScenarioJson {
  id: string;
  title: string;
  symptom: string;
  pipelineSummary: string;
  tables: ScenarioTable[];
  groundTruthRootCause: string;
  expectedHypothesisCategory: string;
  expectedInvestigationPath?: string[];
}

/**
 * Resolve the absolute path to assets/sample-scenario/, trying a handful
 * of candidate roots so this works whether the Next.js process's cwd is
 * the repo root, `sparktrace/`, or `sparktrace/apps/` (dev vs. build vs.
 * various deploy targets), and falling back to a path relative to this
 * source file's own location on disk.
 *
 * NOTE: assets/sample-scenario/ lives outside the `apps` app dir, so it
 * isn't automatically discovered by Next's output file tracing. It's
 * explicitly included for the server build via `outputFileTracingIncludes`
 * in next.config.mjs — keep that config in sync with these candidates.
 */
export function resolveScenarioDir(): string {
  const candidates = [
    // relative to this file: apps/lib/demo -> up 3 -> sparktrace/
    path.join(__dirname, "..", "..", "..", "assets", "sample-scenario"),
    path.join(process.cwd(), "assets", "sample-scenario"),
    path.join(process.cwd(), "..", "assets", "sample-scenario"),
    path.join(process.cwd(), "..", "..", "assets", "sample-scenario"),
    path.join(process.cwd(), "sparktrace", "assets", "sample-scenario"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "scenario.json"))) {
      return candidate;
    }
  }

  throw new Error(
    "SparkTrace demo mode: could not locate assets/sample-scenario/scenario.json. " +
      `Tried: ${candidates.join(", ")}. ` +
      "Ensure the sample-scenario assets directory is deployed alongside the app."
  );
}

let cached: { dir: string; scenario: ScenarioJson } | null = null;

/** Load (and memoize) the bundled scenario.json + its directory. */
export function loadScenario(): { dir: string; scenario: ScenarioJson } {
  if (cached) return cached;
  const dir = resolveScenarioDir();
  const raw = fs.readFileSync(path.join(dir, "scenario.json"), "utf-8");
  const scenario = JSON.parse(raw) as ScenarioJson;
  cached = { dir, scenario };
  return cached;
}
