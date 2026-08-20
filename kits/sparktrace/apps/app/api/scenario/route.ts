/**
 * SparkTrace — bundled demo scenario metadata.
 * ------------------------------------------------------------------
 * GET /api/scenario -> { id, title, symptom }
 *
 * The scenario's identity lives in assets/sample-scenario/scenario.json
 * and is loaded through lib/demo/scenario-paths.ts, which uses node:fs
 * and therefore cannot be imported by the client page. This route is
 * how the UI learns which scenario it is about to run without
 * hardcoding an id that belongs to the asset — the coupling that
 * previously had the form submitting "demo" as a scenarioId.
 */

import { loadScenario } from "../../../lib/demo/scenario-paths";

// Reads from disk; must not be statically evaluated at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const { scenario } = loadScenario();
    return Response.json({
      id: scenario.id,
      title: scenario.title,
      symptom: scenario.symptom,
    });
  } catch (err) {
    // The page degrades to a generic label rather than breaking — a
    // missing asset should not take down the form.
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ message }, { status: 500 });
  }
}
