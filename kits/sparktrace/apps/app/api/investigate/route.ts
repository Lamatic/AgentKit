/**
 * SparkTrace — investigation transport bridge (integration layer)
 * ------------------------------------------------------------------
 * POST /api/investigate
 *   body:  RunInvestigationInput  ({ symptom, source, mode })
 *   reply: streaming NDJSON — one InvestigationEvent per line.
 *
 * This is the server-side bridge between the UI (which consumes an
 * NDJSON stream via components/investigation-client.ts) and the
 * mode-agnostic orchestrator (actions/orchestrate.ts), which returns an
 * AsyncGenerator that can't cross the Server-Action RPC boundary. The
 * route builds the right dependency set for the requested mode and
 * pipes each event out as it is produced.
 */

import { buildDeps, runInvestigation } from "../../../actions/orchestrate";
import type { ExecutionMode, InvestigationEvent, RunInvestigationInput } from "../../../lib/contracts";

// The demo executor / live AWS SDKs are Node libraries, not edge-safe.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMode(v: unknown): v is ExecutionMode {
  return v === "live" || v === "demo";
}

/** Validate + normalize the request body into a RunInvestigationInput. */
function parseInput(body: unknown): RunInvestigationInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "Request body must be a JSON object." };
  const b = body as Record<string, unknown>;

  const symptom = typeof b.symptom === "string" ? b.symptom.trim() : "";
  if (!symptom) return { error: "`symptom` is required." };

  const mode: ExecutionMode = isMode(b.mode) ? b.mode : "demo";

  const rawSource = (b.source ?? {}) as Record<string, unknown>;
  const source = {
    repoUrl: typeof rawSource.repoUrl === "string" ? rawSource.repoUrl : undefined,
    scenarioId: typeof rawSource.scenarioId === "string" ? rawSource.scenarioId : undefined,
  };

  // In live mode a repo URL is expected; demo mode ignores it and uses
  // the bundled scenario, so we don't hard-require it here.
  return { symptom, mode, source };
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseInput(body);
  if ("error" in parsed) {
    return Response.json({ message: parsed.error }, { status: 400 });
  }
  const input = parsed;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: InvestigationEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        const deps = await buildDeps(input.mode);
        for await (const event of runInvestigation(input, deps)) {
          write(event);
        }
      } catch (err) {
        // buildDeps() itself can throw (e.g. live mode with missing
        // AWS/Lamatic env). Surface it as a normal error event so the UI
        // renders it instead of the stream just dying.
        const message = err instanceof Error ? err.message : String(err);
        write({ type: "error", message });
        write({ type: "status", status: "error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
