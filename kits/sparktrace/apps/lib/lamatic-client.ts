/**
 * SparkTrace — Lamatic reasoning client (Module C, v2)
 * ------------------------------------------------------------------
 * Implements `LamaticReasoner` (see ./contracts.ts) on top of the
 * `lamatic` npm SDK, following the pattern in
 * _agentkit_ref/kits/deep-search/apps/lib/lamatic-client.ts.
 *
 * v2 is a set of FIVE tiered flows, one per method:
 *   - plan()          -> flow: sparktrace-planner     (Opus 4.8)
 *   - readRepo()      -> flow: sparktrace-repo-reader  (Sonnet 5)
 *   - generateQuery() -> flow: sparktrace-query-gen    (Sonnet 5 / Haiku 4.5)
 *   - analyze()       -> flow: sparktrace-analyst      (Haiku 4.5)
 *   - report()        -> flow: sparktrace-reporter     (Sonnet 5)
 *
 * Every flow is expected to return strict JSON (Lamatic "Generate JSON"
 * node) matching the corresponding contract shape. Because prompt/flow
 * output can drift from the TS contract (field renames, extra
 * wrapping, stringified JSON, markdown code fences, etc.) every method
 * runs its result through a defensive JSON extractor and then a
 * strict validator that throws a clear, actionable
 * `[lamatic-client] <flow>: <reason>` error on malformed output
 * instead of silently passing bad data into the orchestration loop.
 *
 * Env vars are read LAZILY, per call, not eagerly in the constructor:
 * `makeLamaticReasoner()` never throws just from being constructed —
 * only the specific method actually invoked (and therefore the
 * specific flow-id env var it needs) can throw a missing-env error.
 * This keeps demo mode (which never imports this module) and any
 * partially-configured live setup from failing at import time.
 *
 * NOTE: this module makes real network calls when its methods are
 * invoked; demo mode never reaches it.
 */

import { Lamatic } from "lamatic";
import lamaticConfig from "../../lamatic.config";
import type {
  CompactResult,
  DiagnosticQuery,
  EvidenceItem,
  Hypothesis,
  HypothesisCategory,
  HypothesisStatus,
  Investigation,
  InvestigationStep,
  LamaticReasoner,
  PipelineContext,
  PipelineFile,
  PlannerAction,
  PlannerDecision,
  PlannerEvidence,
  QueryEngine,
  RepoInsight,
  RootCauseReport,
  StepAnalysis,
  StepVerdict,
  TableRef,
} from "./contracts";

// ─────────────────────────────────────────────────────────────
// Env / config (read lazily — see file header)
// ─────────────────────────────────────────────────────────────

/**
 * Hard deadline for a single `executeFlow` call. The Lamatic SDK's
 * `executeFlow` does not accept an `AbortSignal`, so a timeout here can't
 * truly cancel the underlying network call — it only stops the caller
 * (and the five reasoner methods built on `callFlow`) from waiting on a
 * hung or unexpectedly slow flow forever.
 */
const FLOW_TIMEOUT_MS = 60_000;

/**
 * Resolve a step's flow-id env var name from the parent kit's
 * `lamatic.config.ts`, which declares `steps[].envKey` as the canonical
 * mapping. Reading it here (rather than duplicating the literals) keeps the
 * config the single source of truth, per CONTRIBUTING.md.
 */
function envKeyForStep(stepId: string): string {
  const step = lamaticConfig.steps.find((s) => s.id === stepId);
  if (!step?.envKey) {
    throw new Error(
      `[lamatic-client] step "${stepId}" has no envKey in lamatic.config.ts — ` +
        `add it to steps[] so the flow id can be resolved.`
    );
  }
  return step.envKey;
}

function requireEnv(name: string, flowLabel: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[lamatic-client] ${flowLabel}: missing required environment variable "${name}". ` +
        `Set it in your .env.local (see apps/.env.example).`
    );
  }
  return value;
}

// ─────────────────────────────────────────────────────────────
// Defensive JSON extraction
// ─────────────────────────────────────────────────────────────

/** Keys under which a flow might nest its "real" JSON payload. */
const WRAPPER_KEYS = ["output", "json", "data", "response", "answer", "content", "text", "message", "result"];

/**
 * Pulls a JSON value out of a Lamatic flow result that may be:
 *  - already the correct object,
 *  - a JSON string (optionally fenced in ```json ... ```),
 *  - nested one level under a common wrapper key ("output", "answer", ...).
 * Throws a clear error if nothing parseable is found.
 */
function extractJson(raw: unknown, flowLabel: string): unknown {
  if (raw == null) {
    throw new Error(`[lamatic-client] ${flowLabel}: flow returned no result.`);
  }
  if (typeof raw === "string") {
    return parseJsonString(raw, flowLabel);
  }
  if (typeof raw === "object") {
    return raw;
  }
  throw new Error(`[lamatic-client] ${flowLabel}: unexpected flow result type "${typeof raw}".`);
}

function parseJsonString(raw: string, flowLabel: string): unknown {
  let text = raw.trim();

  // Strip a ```json ... ``` or ``` ... ``` fence if present.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    // Fall back: grab the first balanced-looking {...} or [...] substring.
    const braceMatch = text.match(/[{[][\s\S]*[}\]]/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // fall through to error below
      }
    }
    throw new Error(
      `[lamatic-client] ${flowLabel}: could not parse JSON from flow output. ` +
        `First 200 chars: ${text.slice(0, 200)}`
    );
  }
}

/**
 * Given a parsed JSON value, locate an object that plausibly contains
 * `expectedKeys`. Handles flows that wrap their JSON payload under a
 * common key (e.g. `{ output: { action: "gen_query", ... } }`) or
 * double-encode it as a string under that key — one wrapper level, as
 * specified (depth is still bounded defensively).
 */
function coerceToObject(
  value: unknown,
  expectedKeys: string[],
  flowLabel: string,
  depth = 0
): Record<string, unknown> {
  if (depth > 4) {
    throw new Error(`[lamatic-client] ${flowLabel}: gave up unwrapping flow output (too deeply nested).`);
  }

  if (typeof value === "string") {
    return coerceToObject(parseJsonString(value, flowLabel), expectedKeys, flowLabel, depth + 1);
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (expectedKeys.some((key) => key in obj)) {
      return obj;
    }
    for (const wrapperKey of WRAPPER_KEYS) {
      if (wrapperKey in obj && obj[wrapperKey] != null) {
        try {
          return coerceToObject(obj[wrapperKey], expectedKeys, flowLabel, depth + 1);
        } catch {
          // try the next wrapper key
        }
      }
    }
    // No expected key found anywhere obvious — return as-is and let the
    // field-level validators produce a precise error about what's missing.
    return obj;
  }

  throw new Error(
    `[lamatic-client] ${flowLabel}: expected an object with one of [${expectedKeys.join(", ")}], ` +
      `got ${JSON.stringify(value)?.slice(0, 200)}`
  );
}

// ─────────────────────────────────────────────────────────────
// Field-level validation helpers
// ─────────────────────────────────────────────────────────────

function fail(flowLabel: string, message: string): never {
  throw new Error(`[lamatic-client] ${flowLabel}: ${message}`);
}

function str(obj: Record<string, unknown>, key: string, flowLabel: string, fallback?: string): string {
  const value = obj[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  fail(flowLabel, `missing/invalid required string field "${key}" (got ${JSON.stringify(value)}).`);
}

function optStr(obj: Record<string, unknown>, key: string, fallback = ""): string {
  const value = obj[key];
  return typeof value === "string" ? value : fallback;
}

function num(obj: Record<string, unknown>, key: string, flowLabel: string, fallback?: number): number {
  const value = obj[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  if (fallback !== undefined) return fallback;
  fail(flowLabel, `missing/invalid required number field "${key}" (got ${JSON.stringify(value)}).`);
}

function arr(obj: Record<string, unknown>, key: string, flowLabel: string): unknown[] {
  const value = obj[key];
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  fail(flowLabel, `expected array field "${key}", got ${JSON.stringify(value)}.`);
}

function genId(prefix: string): string {
  try {
    // Node 18+ / edge runtime global
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

const HYPOTHESIS_CATEGORIES: HypothesisCategory[] = [
  "schema-drift",
  "data-skew",
  "null-spike",
  "late-arriving",
  "partition-miss",
  "join-explosion",
  "dedup-bug",
  "upstream-change",
  "volume-anomaly",
  "other",
];

/** Safe default (per task spec: category may default safely). */
function coerceCategory(value: unknown): HypothesisCategory {
  if (typeof value === "string" && (HYPOTHESIS_CATEGORIES as string[]).includes(value)) {
    return value as HypothesisCategory;
  }
  return "other";
}

const HYPOTHESIS_STATUSES: HypothesisStatus[] = ["open", "confirmed", "refuted", "inconclusive"];

function coerceStatus(value: unknown): HypothesisStatus {
  if (typeof value === "string" && (HYPOTHESIS_STATUSES as string[]).includes(value)) {
    return value as HypothesisStatus;
  }
  return "open";
}

const STEP_VERDICTS: StepVerdict[] = ["confirmed", "refuted", "inconclusive"];

/** Hard gate: verdict drives hypothesis.status in the orchestrator loop. */
function coerceVerdict(value: unknown, flowLabel: string): StepVerdict {
  if (typeof value === "string" && (STEP_VERDICTS as string[]).includes(value)) {
    return value as StepVerdict;
  }
  fail(flowLabel, `invalid verdict "${String(value)}" — expected one of ${STEP_VERDICTS.join(", ")}.`);
}

const STEP_HINTS: NonNullable<StepAnalysis["hint"]>[] = ["conclude", "next-hypothesis", "refine-query"];

/** Advisory only (contracts.ts: "the PLANNER decides the actual next action") — default to undefined, never throw. */
function coerceHint(value: unknown): StepAnalysis["hint"] {
  if (typeof value === "string" && (STEP_HINTS as string[]).includes(value)) {
    return value as StepAnalysis["hint"];
  }
  return undefined;
}

const PLANNER_ACTIONS: PlannerAction[] = ["gen_query", "read_repo", "conclude"];

/** Hard gate: this value drives the orchestrator's switch statement. */
function coercePlannerAction(value: unknown, flowLabel: string): PlannerAction {
  if (typeof value === "string" && (PLANNER_ACTIONS as string[]).includes(value)) {
    return value as PlannerAction;
  }
  fail(flowLabel, `invalid action "${String(value)}" — expected one of ${PLANNER_ACTIONS.join(", ")}.`);
}

const QUERY_ENGINES: QueryEngine[] = ["athena", "spark-sql"];

/** Safe default (per task spec: engine may default safely). */
function coerceEngine(value: unknown, fallback: QueryEngine): QueryEngine {
  if (typeof value === "string" && (QUERY_ENGINES as string[]).includes(value)) {
    return value as QueryEngine;
  }
  return fallback;
}

function validateHypothesis(raw: unknown, flowLabel: string): Hypothesis {
  if (raw === null || typeof raw !== "object") {
    fail(flowLabel, `hypothesis is not an object.`);
  }
  const obj = raw as Record<string, unknown>;
  const confidenceRaw = num(obj, "confidence", flowLabel, 0.5);
  const confidence = Math.min(1, Math.max(0, confidenceRaw));
  return {
    id: str(obj, "id", flowLabel, genId("hyp")),
    title: str(obj, "title", flowLabel),
    rationale: str(obj, "rationale", flowLabel, ""),
    category: coerceCategory(obj["category"]),
    confidence,
    status: coerceStatus(obj["status"] ?? "open"),
  };
}

/**
 * Validates the per-turn planner output. `action` is hard-gated since
 * it drives the orchestrator's control flow. `hypothesis` is required
 * (and validated strictly) only when the flow actually provided one —
 * a `gen_query` decision with no hypothesis is tolerated here (the
 * orchestrator's own guard treats that as inconclusive-and-continue),
 * but a *malformed* hypothesis object is a real validation failure.
 */
function validatePlannerDecision(raw: unknown, flowLabel: string): PlannerDecision {
  const obj = coerceToObject(raw, ["action"], flowLabel);
  const action = coercePlannerAction(obj["action"], flowLabel);
  const reasoning = str(obj, "reasoning", flowLabel, "");

  const decision: PlannerDecision = { action, reasoning };

  const hypothesisRaw = obj["hypothesis"];
  if (hypothesisRaw !== null && hypothesisRaw !== undefined) {
    decision.hypothesis = validateHypothesis(hypothesisRaw, flowLabel);
  }

  if (typeof obj["focus"] === "string") {
    decision.focus = obj["focus"];
  }

  return decision;
}

function validateRepoInsight(raw: unknown, flowLabel: string, fallbackFocus: string): RepoInsight {
  const obj = coerceToObject(raw, ["insight"], flowLabel);
  return {
    focus: str(obj, "focus", flowLabel, fallbackFocus),
    insight: str(obj, "insight", flowLabel),
  };
}

function validateDiagnosticQuery(
  raw: unknown,
  flowLabel: string,
  fallbackHypothesisId: string,
  fallbackEngine: QueryEngine
): DiagnosticQuery {
  const obj = coerceToObject(raw, ["sql", "query"], flowLabel);
  // Some flows may nest the query under a "query" key.
  const queryObj =
    obj["query"] && typeof obj["query"] === "object" ? (obj["query"] as Record<string, unknown>) : obj;
  const sql = str(queryObj, "sql", flowLabel);
  return {
    id: str(queryObj, "id", flowLabel, genId("q")),
    // hypothesisId/engine are context the orchestrator already knows;
    // trust the flow's value only if present, otherwise fall back to input.
    hypothesisId: optStr(queryObj, "hypothesisId", fallbackHypothesisId) || fallbackHypothesisId,
    engine: coerceEngine(queryObj["engine"], fallbackEngine),
    sql,
    purpose: str(queryObj, "purpose", flowLabel, ""),
  };
}

function validateStepAnalysis(raw: unknown, flowLabel: string): StepAnalysis {
  const obj = coerceToObject(raw, ["verdict"], flowLabel);
  const analysis: StepAnalysis = {
    verdict: coerceVerdict(obj["verdict"], flowLabel),
    reasoning: str(obj, "reasoning", flowLabel, ""),
  };
  const hint = coerceHint(obj["hint"]);
  if (hint !== undefined) analysis.hint = hint;
  return analysis;
}

function validateEvidenceItem(raw: unknown, flowLabel: string, index: number): EvidenceItem {
  if (raw === null || typeof raw !== "object") {
    fail(flowLabel, `evidence[${index}] is not an object.`);
  }
  const obj = raw as Record<string, unknown>;
  return {
    hypothesisId: str(obj, "hypothesisId", flowLabel, ""),
    queryId: str(obj, "queryId", flowLabel, ""),
    finding: str(obj, "finding", flowLabel, ""),
  };
}

function validateRootCauseReport(raw: unknown, flowLabel: string): RootCauseReport {
  const obj = coerceToObject(raw, ["rootCause", "confidence"], flowLabel);
  const confidenceRaw = num(obj, "confidence", flowLabel, 0.5);
  const evidenceRaw = arr(obj, "evidence", flowLabel);
  const caveatsRaw = arr(obj, "caveats", flowLabel);
  return {
    rootCause: str(obj, "rootCause", flowLabel),
    confidence: Math.min(1, Math.max(0, confidenceRaw)),
    evidence: evidenceRaw.map((item, i) => validateEvidenceItem(item, flowLabel, i)),
    suggestedFix: str(obj, "suggestedFix", flowLabel, ""),
    caveats: caveatsRaw.filter((c): c is string => typeof c === "string"),
  };
}

// ─────────────────────────────────────────────────────────────
// Model-payload sanitization (enforces "models never see raw rows /
// whole-repo file bodies" beyond what each flow actually needs)
// ─────────────────────────────────────────────────────────────

/** Slim file descriptor sent to models that only need to know a file exists. */
type ModelSafePipelineFile = Pick<PipelineFile, "path" | "language" | "role">;

/** `PipelineContext` with file bodies stripped — paths only. */
type ModelSafePipelineContext = Omit<PipelineContext, "files"> & {
  files: ModelSafePipelineFile[];
};

/** `InvestigationStep` with the raw (up-to-1000-row) execution result removed. */
type ModelSafeInvestigationStep = Omit<InvestigationStep, "execution">;

/** `Investigation` safe to hand to a model: no raw execution, no full file bodies. */
type ModelSafeInvestigation = Omit<Investigation, "steps" | "pipeline"> & {
  steps: ModelSafeInvestigationStep[];
  pipeline: ModelSafePipelineContext;
};

/**
 * Strips `PipelineContext.files[].content` (whole-repo file bodies), keeping
 * only `summary`, `tables`, `dag`, and file paths/metadata. Use for any flow
 * that just needs to know the shape of the pipeline, not full source — NOT
 * for `readRepo()`'s focus area, which needs the real file content.
 */
function toModelSafePipeline(pipeline: PipelineContext): ModelSafePipelineContext {
  return {
    ...pipeline,
    files: pipeline.files.map((f) => ({ path: f.path, language: f.language, role: f.role })),
  };
}

/**
 * Strips every `steps[].execution` (up to 1000 raw Athena rows each) and
 * trims `pipeline.files[].content` before an `Investigation` is sent to a
 * model. This is the single enforcement point backing the compactor's
 * "models never see raw rows" guarantee for flows (like the reporter) that
 * otherwise receive the whole `Investigation` object.
 */
function toModelSafeInvestigation(investigation: Investigation): ModelSafeInvestigation {
  return {
    ...investigation,
    pipeline: toModelSafePipeline(investigation.pipeline),
    steps: investigation.steps.map(({ execution, ...rest }) => rest),
  };
}

// ─────────────────────────────────────────────────────────────
// Reasoner implementation
// ─────────────────────────────────────────────────────────────

class LamaticClientReasoner implements LamaticReasoner {
  /** Constructed lazily, on first flow call — see file header. */
  private client: Lamatic | undefined;

  private getClient(flowLabel: string): Lamatic {
    if (this.client) return this.client;
    const endpoint = requireEnv("LAMATIC_API_URL", flowLabel);
    const projectId = requireEnv("LAMATIC_PROJECT_ID", flowLabel);
    const apiKey = requireEnv("LAMATIC_API_KEY", flowLabel);
    this.client = new Lamatic({ endpoint, projectId, apiKey });
    return this.client;
  }

  /** Resolves the flow id, calls the flow, and returns its raw (still-unvalidated) result payload. */
  private async callFlow(
    flowIdEnvVar: string,
    flowLabel: string,
    inputs: Record<string, unknown>
  ): Promise<unknown> {
    const flowId = requireEnv(flowIdEnvVar, flowLabel);
    const client = this.getClient(flowLabel);

    let resData: { result?: unknown };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      resData = await Promise.race([
        client.executeFlow(flowId, inputs),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error(`flow execution timed out after ${FLOW_TIMEOUT_MS}ms`)),
            FLOW_TIMEOUT_MS
          );
        }),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[lamatic-client] ${flowLabel}: flow execution failed: ${message}`);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    if (!resData || resData.result === undefined || resData.result === null) {
      throw new Error(`[lamatic-client] ${flowLabel}: flow returned no result.`);
    }
    return extractJson(resData.result, flowLabel);
  }

  async plan(input: {
    symptom: string;
    pipeline: PipelineContext;
    evidence: PlannerEvidence[];
    hypothesesTried: Hypothesis[];
  }): Promise<PlannerDecision> {
    const flowLabel = "sparktrace-planner";
    const raw = await this.callFlow(envKeyForStep("sparktrace-planner"), flowLabel, {
      symptom: input.symptom,
      // Slimmed: summary/tables/dag/paths only — the planner picks a
      // hypothesis/focus, it doesn't need every file's full body.
      pipeline: toModelSafePipeline(input.pipeline),
      evidence: input.evidence,
      hypothesesTried: input.hypothesesTried,
    });
    return validatePlannerDecision(raw, flowLabel);
  }

  async readRepo(input: { symptom: string; pipeline: PipelineContext; focus: string }): Promise<RepoInsight> {
    const flowLabel = "sparktrace-repo-reader";
    // Intentionally NOT sanitized: readRepo's whole job is to read real file
    // content for the requested focus area, so it gets the full pipeline
    // (including PipelineFile.content) unlike the other flows.
    const raw = await this.callFlow(envKeyForStep("sparktrace-repo-reader"), flowLabel, {
      symptom: input.symptom,
      pipeline: input.pipeline,
      focus: input.focus,
    });
    return validateRepoInsight(raw, flowLabel, input.focus);
  }

  async generateQuery(input: {
    symptom: string;
    hypothesis: Hypothesis;
    tables: TableRef[];
    engine: QueryEngine;
  }): Promise<DiagnosticQuery> {
    const flowLabel = "sparktrace-query-gen";
    const raw = await this.callFlow(envKeyForStep("sparktrace-query-gen"), flowLabel, {
      symptom: input.symptom,
      hypothesis: input.hypothesis,
      tables: input.tables,
      engine: input.engine,
    });
    return validateDiagnosticQuery(raw, flowLabel, input.hypothesis.id, input.engine);
  }

  async analyze(input: {
    symptom: string;
    hypothesis: Hypothesis;
    query: DiagnosticQuery;
    result: CompactResult;
  }): Promise<StepAnalysis> {
    const flowLabel = "sparktrace-analyst";
    const raw = await this.callFlow(envKeyForStep("sparktrace-analyst"), flowLabel, {
      symptom: input.symptom,
      hypothesis: input.hypothesis,
      query: input.query,
      result: input.result,
    });
    return validateStepAnalysis(raw, flowLabel);
  }

  async report(input: { investigation: Investigation }): Promise<RootCauseReport> {
    const flowLabel = "sparktrace-reporter";
    // Sanitized: strips steps[].execution (raw rows) and pipeline file
    // bodies before the whole Investigation is handed to the reporter.
    const raw = await this.callFlow(envKeyForStep("sparktrace-reporter"), flowLabel, {
      investigation: toModelSafeInvestigation(input.investigation),
    });
    return validateRootCauseReport(raw, flowLabel);
  }
}

/**
 * Constructs a `LamaticReasoner` backed by the `lamatic` SDK. Does NOT
 * read any env vars or make any network calls at construction time —
 * each method reads only the env vars it actually needs
 * (LAMATIC_API_KEY / LAMATIC_PROJECT_ID / LAMATIC_API_URL plus its own
 * SPARKTRACE_*_FLOW_ID) the first time it is called, and throws a
 * clear `[lamatic-client] <flow>: missing required environment
 * variable "<NAME>"` error if one is missing. Callers should invoke
 * this only when they intend to actually make live Lamatic calls (see
 * `buildDeps("live")` in ../actions/orchestrate.ts) — the demo mode
 * path never imports/calls this factory.
 */
export function makeLamaticReasoner(): LamaticReasoner {
  return new LamaticClientReasoner();
}
