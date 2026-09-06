"use server";

/**
 * EvidenceFit orchestration.
 *
 * Local mode (no Lamatic configured): runs the deterministic engine entirely in this
 * process, using its built-in local ranking (see core.ts `localRank`) as a stand-in for
 * vector search.
 *
 * Deployed mode: delegates BOTH chunking/indexing AND metrics/verdict computation to two
 * Lamatic Studio flows. Unlike an earlier version of this file, this app does not
 * recompute span integrity, coverage, or the verdict itself in deployed mode — the SAME
 * deterministic engine (core.ts, vendored verbatim into each flow's code node) runs
 * inside Lamatic instead, and this app only renders whatever `Comparison` the Evaluate
 * flow hands back. This is what makes the deployed verdict structurally impossible for an
 * LLM node in the flow to override: the metrics code node's output is the only thing
 * wired to `verdict` in the flow's API Response (see docs/STUDIO-BUILD.md), and this app
 * never substitutes its own computation for that value.
 *
 * Deployed flow contract (both flows are built in Lamatic Studio and exported to
 * kits/evidence-fit/flows/ — see kits/evidence-fit/docs/STUDIO-BUILD.md):
 *
 *   Index flow (LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID) — called once per strategy:
 *     request:  { experimentId: string; documentId: string; documentText: string;
 *                 strategy: "fixed-width" | "clause-aware" }
 *     response: { ok: boolean; indexedCount: number; issues?: ValidationIssue[] }
 *       There is no Lamatic chunkNode in this flow. The flow's own code node chunks
 *       documentText deterministically in-process via core.ts `fixedWidthChunks` /
 *       `clauseAwareChunks` (chosen by `strategy`), so every chunk's offsets are known by
 *       construction — Lamatic's built-in splitter has no clause-terminator mode, and its
 *       chunkNode only reports chunk text with no offsets, so it cannot produce the
 *       verified, offset-exact chunks this flow requires. This also guarantees the chunks
 *       indexed here are byte-identical to the ones the Evaluate flow's metrics code node
 *       regenerates from the same documentText, with nothing to keep in sync. This app
 *       treats anything other than `ok: true` with `indexedCount > 0` as a failure and
 *       never proceeds to the Evaluate flow for that experiment.
 *
 *   Evaluate flow (LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID) — called ONCE for the whole
 *   experiment, covering both strategies together (the flow's metrics code node always
 *   searches and scores both, then runs the vendored `compareStrategies` across them in
 *   a single call — there is no per-strategy call to make):
 *     request:  { experimentId: string; documentId: string; documentText: string;
 *                 topK: number;
 *                 cases: { id: string; question: string;
 *                          evidence: { quote: string; start?: number; end?: number }[];
 *                          required?: boolean }[] }
 *     response: { verdict: "SHIP" | "TUNE" | "BLOCK";
 *                 baseline: StrategyResult; candidate: StrategyResult;
 *                 recommended: "fixed-width" | "clause-aware" | "neither";
 *                 explanation?: string; ok?: boolean; issues?: ValidationIssue[] }
 *       The metrics code node builds this by running real vector search for both
 *       strategies and feeding the results through the vendored `compareStrategies`, so
 *       `verdict` and every metric field are identical in shape and derivation to local
 *       mode's own `compareStrategies` output — this app returns them as-is, tagged
 *       `mode: "deployed"`, never recomputed. The response is parsed defensively (Lamatic
 *       may wrap or JSON-stringify it — see `unwrapRecord`) and its shape is validated
 *       before being trusted: a missing or malformed `verdict`, `baseline`, `candidate`,
 *       or any of their numeric rate fields, produces a typed `upstream` error naming the
 *       API Response mapping — never a silent fallback to local computation and never a
 *       best-effort guess at the missing pieces. The optional `explanation` field (from a
 *       separate LLM node) is not part of `Comparison` and is never read here; the LLM has
 *       no graph path to `verdict`.
 */

import {
  compareStrategies,
  resolveGoldSpans,
  type AcceptanceCaseInput,
  type CaseResult,
  type Chunk,
  type Comparison,
  type Rate,
  type StrategyName,
  type StrategyResult,
  type ValidationIssue,
  type Verdict,
} from "../lib/evidence/core.ts";
import { validateExperimentInput, type ExperimentInput } from "../lib/validation.ts";
import { getLamaticClient, isLamaticConfigured, unwrapRecord } from "../lib/lamatic-client.ts";

export type OrchestrateResult =
  | { ok: false; kind: "validation"; errors: string[] }
  | { ok: false; kind: "engine"; mode: "local" | "deployed"; issues: ValidationIssue[] }
  | { ok: false; kind: "upstream"; message: string }
  | { ok: true; mode: "local" | "deployed"; comparison: Comparison };

const STRATEGIES: StrategyName[] = ["fixed-width", "clause-aware"];

/**
 * Runtime boundary check for `runComparison`'s argument. A server action is callable over
 * the network with an arbitrary JSON body (or no body at all), so nothing past this point
 * may assume `input` is an object — let alone that it has the right fields — before this
 * has run. This only confirms *shape* (so every field access below, and inside
 * `validateExperimentInput`, is safe); size/format rules (id length, quote counts, etc.)
 * remain `validateExperimentInput`'s job so those messages stay unchanged.
 */
function checkInputShape(input: unknown): string[] | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return ["Request payload must be a JSON object."];
  }

  const rec = input as Record<string, unknown>;
  const errors: string[] = [];

  if (rec.experimentId !== undefined && typeof rec.experimentId !== "string") {
    errors.push("experimentId must be a string.");
  }
  if (rec.documentId !== undefined && typeof rec.documentId !== "string") {
    errors.push("documentId must be a string.");
  }
  if (rec.documentText !== undefined && typeof rec.documentText !== "string") {
    errors.push("documentText must be a string.");
  }
  if (rec.cases !== undefined && !Array.isArray(rec.cases)) {
    errors.push("cases must be an array.");
  } else if (Array.isArray(rec.cases)) {
    rec.cases.forEach((c, i) => {
      if (typeof c !== "object" || c === null || Array.isArray(c)) {
        errors.push(`Case at position ${i + 1} must be an object.`);
      }
    });
  }
  if (rec.topK !== undefined && typeof rec.topK !== "number") {
    errors.push("topK must be a number.");
  }

  return errors.length > 0 ? errors : null;
}

export async function runComparison(input: unknown): Promise<OrchestrateResult> {
  const shapeErrors = checkInputShape(input);
  if (shapeErrors) {
    return { ok: false, kind: "validation", errors: shapeErrors };
  }
  // Shape is now confirmed safe to access field-by-field. validateExperimentInput still
  // owns the detailed size/format rules (id length, quote counts, required fields, etc.).
  const experimentInput = input as ExperimentInput;

  const validation = validateExperimentInput(experimentInput);
  if (!validation.ok) {
    return { ok: false, kind: "validation", errors: validation.errors };
  }

  const topK = experimentInput.topK ?? 5;

  if (!isLamaticConfigured()) {
    const result = compareStrategies({
      documentId: experimentInput.documentId,
      documentText: experimentInput.documentText,
      cases: experimentInput.cases,
      topK,
    });
    if (!result.ok) {
      return { ok: false, kind: "engine", mode: "local", issues: result.issues };
    }
    return { ok: true, mode: "local", comparison: result.comparison };
  }

  return runDeployed(experimentInput, topK);
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
  // the operator's problem, not a reason to spend an index/evaluate round trip. The
  // Evaluate flow re-resolves them itself from the same documentText/cases, but failing
  // fast here saves two flow calls on bad input and gives the operator the same issues
  // local mode would have reported.
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

  for (const strategy of STRATEGIES) {
    try {
      await runIndexFlow(client, indexFlowId, {
        experimentId: input.experimentId,
        documentId: input.documentId,
        documentText: input.documentText,
        strategy,
      });
    } catch (err) {
      return { ok: false, kind: "upstream", message: upstreamMessage("Index", strategy, err) };
    }
  }

  let comparison: Comparison;
  try {
    comparison = await runEvaluateFlow(client, evaluateFlowId, {
      experimentId: input.experimentId,
      documentId: input.documentId,
      documentText: input.documentText,
      topK,
      cases: input.cases,
    });
  } catch (err) {
    return {
      ok: false,
      kind: "upstream",
      message: upstreamMessage("Evaluate", "both strategies", err),
    };
  }

  return { ok: true, mode: "deployed", comparison };
}

async function runIndexFlow(
  client: ReturnType<typeof getLamaticClient>,
  flowId: string,
  input: { experimentId: string; documentId: string; documentText: string; strategy: StrategyName }
): Promise<void> {
  const res = await client.executeFlow(flowId, input);
  if (res.status === "error") {
    throw new Error(res.message ?? "index flow returned an error status");
  }
  const parsed = unwrapRecord(res.result ?? {});
  if (parsed.ok !== true) {
    throw new Error("index flow reported ok:false — indexing was skipped for this strategy");
  }
  const indexedCount = asFiniteNumber(parsed.indexedCount);
  if (indexedCount === null || indexedCount <= 0) {
    throw new Error("index flow indexed no chunks");
  }
}

async function runEvaluateFlow(
  client: ReturnType<typeof getLamaticClient>,
  flowId: string,
  input: {
    experimentId: string;
    documentId: string;
    documentText: string;
    topK: number;
    cases: AcceptanceCaseInput[];
  }
): Promise<Comparison> {
  const res = await client.executeFlow(flowId, input);
  if (res.status === "error") {
    throw new Error(res.message ?? "evaluate flow returned an error status");
  }
  const parsed = unwrapRecord(res.result ?? {});
  const comparison = parseComparison(parsed);
  if (!comparison) {
    throw new Error("evaluate flow did not return a valid comparison shape");
  }
  return comparison;
}

// ---- Defensive shape validation for the Evaluate flow's response -----------------------
//
// The Evaluate flow computes the entire Comparison (verdict, baseline, candidate) inside
// its metrics code node — this app must never recompute it, only trust it once its shape
// is verified field by field. Every check below is a type/shape check, never a coercion:
// a field that is present but the wrong shape fails validation exactly like a missing
// field, and nothing here fills in a default for a bad value.

function isRate(v: unknown): v is Rate {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.numerator === "number" &&
    typeof r.denominator === "number" &&
    typeof r.rate === "number"
  );
}

function isVerdict(v: unknown): v is Verdict {
  return v === "SHIP" || v === "TUNE" || v === "BLOCK";
}

function isChunk(v: unknown): v is Chunk {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.chunkId === "string" &&
    typeof c.documentId === "string" &&
    (c.strategy === "fixed-width" || c.strategy === "clause-aware") &&
    typeof c.start === "number" &&
    typeof c.end === "number" &&
    typeof c.text === "string"
  );
}

function isCaseResult(v: unknown): v is CaseResult {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.caseId === "string" &&
    typeof c.question === "string" &&
    typeof c.required === "boolean" &&
    isRate(c.spanCoverageAtK) &&
    (c.firstCompleteEvidenceRank === null || typeof c.firstCompleteEvidenceRank === "number") &&
    typeof c.complete === "boolean" &&
    Array.isArray(c.severedSpans)
  );
}

function isStrategyResult(v: unknown, expectedStrategy: StrategyName): v is StrategyResult {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    s.strategy === expectedStrategy &&
    typeof s.chunkCount === "number" &&
    isRate(s.spanIntegrityRate) &&
    typeof s.boundarySeveredCount === "number" &&
    isRate(s.spanCoverageAtK) &&
    isRate(s.completeEvidenceRecallAtK) &&
    isVerdict(s.verdict) &&
    Array.isArray(s.cases) &&
    s.cases.every(isCaseResult) &&
    Array.isArray(s.chunks) &&
    s.chunks.every(isChunk)
  );
}

/**
 * Validates that a parsed Evaluate-flow response carries a real `Comparison` — a
 * `verdict` that is exactly SHIP/TUNE/BLOCK, a `recommended` that is exactly
 * fixed-width/clause-aware/neither, and both `baseline` and `candidate` as full
 * `StrategyResult`s with valid numeric rate objects and a `cases` array. Returns null on
 * any mismatch — including a `baseline`/`candidate` that is `null` (the metrics node's own
 * `ok: false` shape) — so the caller can surface an actionable upstream error instead of
 * handing the UI a value it cannot safely render.
 */
function parseComparison(parsed: Record<string, unknown>): Comparison | null {
  const verdict = parsed.verdict;
  if (!isVerdict(verdict)) return null;

  const recommended = parsed.recommended;
  if (recommended !== "fixed-width" && recommended !== "clause-aware" && recommended !== "neither") {
    return null;
  }

  const baseline = parsed.baseline;
  if (!isStrategyResult(baseline, "fixed-width")) return null;

  const candidate = parsed.candidate;
  if (!isStrategyResult(candidate, "clause-aware")) return null;

  return { baseline, candidate, recommended, verdict };
}

/**
 * Lamatic's GraphQL API Response maps every field through a quoted template
 * (`"indexedCount": "{{vectorNode_4.output.recordsIndexed}}"`), so a numeric field
 * arrives as a string — Studio's own test pane reports the Index flow's `recordsIndexed`
 * as `string`. `unwrap` in lamatic-client.ts converts "true"/"false" to booleans and
 * JSON-parses stringified objects, but deliberately leaves other scalars as strings, so
 * a numeric string reaches here intact. Accept both forms: rejecting "4" would report a
 * perfectly successful index run as "indexed no chunks".
 *
 * Still strict about what a number is — an empty string, whitespace, null, or anything
 * non-numeric yields null, so a missing or malformed field is never read as 0.
 */
function asFiniteNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type UpstreamErrorClass = "timeout" | "connection" | "invalid_shape" | "reported_failure" | "unknown";

function classifyUpstreamError(raw: string): UpstreamErrorClass {
  if (/EXECUTE_SOFT_TIMEOUT|timed?\s*out|timeout/i.test(raw)) return "timeout";
  if (/fetch failed|ECONNRESET|ETIMEDOUT|socket hang up|UND_ERR/i.test(raw)) return "connection";
  if (/did not return a valid comparison shape/i.test(raw)) return "invalid_shape";
  if (/indexed no chunks|reported ok:false/i.test(raw)) return "reported_failure";
  return "unknown";
}

/**
 * Turns an upstream failure into an actionable, generic message. The raw error text is
 * used here for classification only. It is never interpolated into the string returned
 * to the caller, and never written to server logs — not even redacted.
 *
 * An earlier version logged a redacted excerpt of it. That leaked twice over: the
 * Authorization rule matched `\S+`, so `Authorization: Bearer abc123` lost only the
 * word `Bearer` and kept a short token; and redaction by pattern cannot remove what it
 * cannot recognise, so ordinary echoed request content — the document under test, the
 * acceptance-case quotes, which for this kit are exactly the confidential contract
 * clauses someone is evaluating — passed through untouched. The classification below is
 * what makes a failure actionable; the excerpt only ever added exposure.
 */
function upstreamMessage(label: "Index" | "Evaluate", detail: string, err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const classification = classifyUpstreamError(raw);
  console.error(`[evidence-fit] ${label} flow (${detail}) failed [${classification}]`);

  switch (classification) {
    case "timeout":
      return `${label} flow (${detail}) timed out. Check that it is deployed and responding within the request window, then retry.`;
    case "connection":
      return `${label} flow (${detail}) dropped the connection. Check that it is deployed, then retry.`;
    case "invalid_shape":
      return (
        `${label} flow (${detail}) returned a response that does not match the documented contract. ` +
        `Check that its API Response outputMapping wires verdict, baseline and candidate straight ` +
        `from the metrics code node.`
      );
    case "reported_failure":
      return `${label} flow (${detail}) reported a failure. Check that its API Response mapping matches the documented contract and that indexing/alignment succeeded.`;
    default:
      return `${label} flow (${detail}) failed. Check that the flow is deployed and its API Response mapping matches the documented contract, then retry.`;
  }
}
