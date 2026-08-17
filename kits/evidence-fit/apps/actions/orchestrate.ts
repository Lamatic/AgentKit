"use server";

/**
 * EvidenceFit orchestration.
 *
 * Local mode (no Lamatic configured): runs the deterministic engine entirely in this
 * process, using its built-in local ranking (see core.ts `localRank`) as a stand-in for
 * vector search.
 *
 * Deployed mode: delegates chunking and retrieval ranking to two Lamatic Studio flows,
 * then feeds their output back through the SAME deterministic engine so that span
 * integrity, coverage, and the verdict are computed identically in both modes — only the
 * per-question ranking source changes.
 *
 * Deployed flow contract (these flows are built manually in Lamatic Studio and are not
 * part of this repository yet — see kits/evidence-fit/README.md):
 *
 *   Index flow (LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID) — called once per strategy:
 *     request:  { documentId: string; documentText: string; strategy: "fixed-width" | "clause-aware" }
 *     response: { chunks: string[] }
 *       Ordered chunk texts (pageContent) produced by chunking + indexing the document
 *       under the given strategy. Lamatic's chunkNode does not report offsets, so this
 *       app recovers them itself via core.ts `alignChunks` — a verbatim-substring scan
 *       against documentText. A chunk text that cannot be located is an alignment error,
 *       never an estimated offset.
 *
 *   Evaluate flow (LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID) — called once per strategy:
 *     request:  { documentId: string; strategy: "fixed-width" | "clause-aware"; topK: number;
 *                 cases: { id: string; question: string }[] }
 *     response: { rankings: Record<caseId, string[]> }
 *       For each case id, the chunk texts (pageContent) returned by vector search against
 *       that strategy's collection, ordered by rank. Every returned text must exactly
 *       match a chunk text produced by the index flow for the same strategy — resolved
 *       here to the aligned Chunk it came from, never guessed at.
 */

import {
  alignChunks,
  compareStrategies,
  resolveGoldSpans,
  type Chunk,
  type Comparison,
  type ResolvedCase,
  type StrategyName,
  type ValidationIssue,
} from "../lib/evidence/core.ts";
import { validateExperimentInput, type ExperimentInput } from "../lib/validation.ts";
import {
  asRecord,
  asStringArray,
  getLamaticClient,
  isLamaticConfigured,
  unwrapRecord,
} from "../lib/lamatic-client.ts";

export type OrchestrateResult =
  | { ok: false; kind: "validation"; errors: string[] }
  | { ok: false; kind: "engine"; mode: "local" | "deployed"; issues: ValidationIssue[] }
  | { ok: false; kind: "upstream"; message: string }
  | { ok: true; mode: "local" | "deployed"; comparison: Comparison };

const STRATEGIES: StrategyName[] = ["fixed-width", "clause-aware"];

export async function runComparison(input: ExperimentInput): Promise<OrchestrateResult> {
  const validation = validateExperimentInput(input);
  if (!validation.ok) {
    return { ok: false, kind: "validation", errors: validation.errors };
  }

  const topK = input.topK ?? 5;

  if (!isLamaticConfigured()) {
    const result = compareStrategies({
      documentId: input.documentId,
      documentText: input.documentText,
      cases: input.cases,
      topK,
    });
    if (!result.ok) {
      return { ok: false, kind: "engine", mode: "local", issues: result.issues };
    }
    return { ok: true, mode: "local", comparison: result.comparison };
  }

  return runDeployed(input, topK);
}

async function runDeployed(input: ExperimentInput, topK: number): Promise<OrchestrateResult> {
  const indexFlowId = process.env.LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID;
  const evaluateFlowId = process.env.LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID;
  if (!indexFlowId || !evaluateFlowId) {
    return {
      ok: false,
      kind: "upstream",
      message:
        "Deployed flows are not configured. Build the Index and Evaluate flows in Lamatic Studio " +
        "against the documented contract, then set LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID and " +
        "LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID in apps/.env.local.",
    };
  }

  // Gold spans must resolve before any Lamatic call is made — an unresolvable quote is
  // the operator's problem, not a reason to spend an index/evaluate round trip.
  const resolved = resolveGoldSpans(input.documentText, input.cases);
  if (!resolved.ok) {
    return { ok: false, kind: "engine", mode: "deployed", issues: resolved.issues };
  }

  let client: ReturnType<typeof getLamaticClient>;
  try {
    client = getLamaticClient();
  } catch {
    return {
      ok: false,
      kind: "upstream",
      message:
        "Lamatic client could not be constructed. Check LAMATIC_API_KEY, LAMATIC_PROJECT_ID and " +
        "LAMATIC_API_URL in apps/.env.local.",
    };
  }

  const rankedByStrategy: Partial<Record<StrategyName, Record<string, Chunk[]>>> = {};

  for (const strategy of STRATEGIES) {
    let chunkTexts: string[];
    try {
      chunkTexts = await runIndexFlow(client, indexFlowId, input.documentId, input.documentText, strategy);
    } catch (err) {
      return { ok: false, kind: "upstream", message: upstreamMessage("Index", strategy, err) };
    }

    const aligned = alignChunks(input.documentText, chunkTexts, input.documentId, strategy);
    if (!aligned.ok) {
      return { ok: false, kind: "engine", mode: "deployed", issues: aligned.issues };
    }

    const byText = new Map<string, Chunk>();
    for (const ch of aligned.chunks) {
      if (!byText.has(ch.text)) byText.set(ch.text, ch);
    }

    let rankings: Record<string, string[]>;
    try {
      rankings = await runEvaluateFlow(
        client,
        evaluateFlowId,
        input.documentId,
        strategy,
        topK,
        resolved.cases
      );
    } catch (err) {
      return { ok: false, kind: "upstream", message: upstreamMessage("Evaluate", strategy, err) };
    }

    const mismatch = mapRankingsToChunks(resolved.cases, rankings, byText, strategy);
    if (!mismatch.ok) {
      return { ok: false, kind: "engine", mode: "deployed", issues: mismatch.issues };
    }
    rankedByStrategy[strategy] = mismatch.rankedByCaseId;
  }

  const result = compareStrategies({
    documentId: input.documentId,
    documentText: input.documentText,
    cases: input.cases,
    topK,
    rankedByStrategy,
  });
  if (!result.ok) {
    return { ok: false, kind: "engine", mode: "deployed", issues: result.issues };
  }
  return { ok: true, mode: "deployed", comparison: result.comparison };
}

function mapRankingsToChunks(
  cases: ResolvedCase[],
  rankings: Record<string, string[]>,
  byText: Map<string, Chunk>,
  strategy: StrategyName
): { ok: true; rankedByCaseId: Record<string, Chunk[]> } | { ok: false; issues: ValidationIssue[] } {
  const rankedByCaseId: Record<string, Chunk[]> = {};

  for (const c of cases) {
    const texts = rankings[c.id] ?? [];
    const chunks: Chunk[] = [];
    for (const text of texts) {
      const ch = byText.get(text);
      if (!ch) {
        return {
          ok: false,
          issues: [
            {
              code: "alignment_error",
              message:
                `Case "${c.id}": the evaluate flow (${strategy}) returned a chunk that the index ` +
                `flow never produced for this document. Re-run indexing before evaluating.`,
              caseId: c.id,
            },
          ],
        };
      }
      chunks.push(ch);
    }
    rankedByCaseId[c.id] = chunks;
  }

  return { ok: true, rankedByCaseId };
}

async function runIndexFlow(
  client: ReturnType<typeof getLamaticClient>,
  flowId: string,
  documentId: string,
  documentText: string,
  strategy: StrategyName
): Promise<string[]> {
  const res = await client.executeFlow(flowId, { documentId, documentText, strategy });
  if (res.status === "error") {
    throw new Error(res.message ?? "index flow returned an error status");
  }
  const parsed = unwrapRecord(res.result ?? {});
  const chunks = asStringArray(parsed.chunks);
  if (chunks.length === 0) {
    throw new Error("index flow returned no chunks");
  }
  return chunks;
}

async function runEvaluateFlow(
  client: ReturnType<typeof getLamaticClient>,
  flowId: string,
  documentId: string,
  strategy: StrategyName,
  topK: number,
  cases: ResolvedCase[]
): Promise<Record<string, string[]>> {
  const res = await client.executeFlow(flowId, {
    documentId,
    strategy,
    topK,
    cases: cases.map((c) => ({ id: c.id, question: c.question })),
  });
  if (res.status === "error") {
    throw new Error(res.message ?? "evaluate flow returned an error status");
  }
  const parsed = unwrapRecord(res.result ?? {});
  const rankingsRaw = asRecord(parsed.rankings);
  const rankings: Record<string, string[]> = {};
  for (const [caseId, value] of Object.entries(rankingsRaw)) {
    rankings[caseId] = asStringArray(value);
  }
  return rankings;
}

/**
 * Turns an upstream failure into an actionable, generic message. The raw error text is
 * only ever used here for classification (and server-side logging) — it is never
 * interpolated into the string returned to the caller, since it may echo request
 * details or credentials from the transport layer.
 */
function upstreamMessage(label: "Index" | "Evaluate", strategy: StrategyName, err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  console.error(`[evidence-fit] ${label} flow (${strategy}) failed:`, raw);

  if (/EXECUTE_SOFT_TIMEOUT|timed?\s*out|timeout/i.test(raw)) {
    return `${label} flow (${strategy}) timed out. Check that it is deployed and responding within the request window, then retry.`;
  }
  if (/fetch failed|ECONNRESET|ETIMEDOUT|socket hang up|UND_ERR/i.test(raw)) {
    return `${label} flow (${strategy}) dropped the connection. Check that it is deployed, then retry.`;
  }
  if (/returned no chunks/i.test(raw)) {
    return `${label} flow (${strategy}) returned no chunks. Check that its API Response mapping matches the documented contract.`;
  }
  return `${label} flow (${strategy}) failed. Check that the flow is deployed and its API Response mapping matches the documented contract, then retry.`;
}
