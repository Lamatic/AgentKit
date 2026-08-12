/**
 * SparkTrace — Shared Contracts (v2: planner-driven, model-tiered, token-economical)
 * ------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for all module boundaries. Every component imports
 * types from HERE; nothing crosses a module boundary except through these
 * shapes. Do not fork or redefine these types locally.
 *
 * v2 changes vs v1:
 *  - The reasoner is a set of TIERED agents: plan() is a per-turn PLANNER
 *    decision (Opus), not a one-shot plan. New readRepo() (Sonnet). analyze()
 *    now consumes a COMPACTED result (Haiku), never raw rows.
 *  - New deterministic layers: QueryGuard (read-only + cost) and Compactor
 *    (<=10 sample rows + stats) — enforced in the orchestrator between calls.
 */

// ─────────────────────────────────────────────────────────────
// Pipeline understanding (produced by the ingestion layer)
// ─────────────────────────────────────────────────────────────

export type FileRole = "source" | "transform" | "sink" | "config" | "unknown";
export type FileLanguage = "python" | "sql" | "scala" | "yaml" | "other";

export interface PipelineFile {
  path: string;
  language: FileLanguage;
  role: FileRole;
  content: string;
}

export interface ColumnRef {
  name: string;
  type: string;
}

export type TableKind = "source" | "sink" | "intermediate";

export interface TableRef {
  database: string;
  name: string;
  kind: TableKind;
  columns?: ColumnRef[];
  location?: string;
}

export interface DagNode {
  id: string;
  op: string; // "read_parquet", "join", "groupBy", "write", ...
  inputs: string[];
  outputs: string[];
  file?: string;
}

export interface PipelineContext {
  repoUrl?: string;
  files: PipelineFile[];
  tables: TableRef[];
  dag: DagNode[];
  summary: string;
}

// ─────────────────────────────────────────────────────────────
// Hypotheses & queries
// ─────────────────────────────────────────────────────────────

export type HypothesisCategory =
  | "schema-drift"
  | "data-skew"
  | "null-spike"
  | "late-arriving"
  | "partition-miss"
  | "join-explosion"
  | "dedup-bug"
  | "upstream-change"
  | "volume-anomaly"
  | "other";

export type HypothesisStatus = "open" | "confirmed" | "refuted" | "inconclusive";

export interface Hypothesis {
  id: string;
  title: string;
  rationale: string;
  category: HypothesisCategory;
  confidence: number; // 0..1
  status: HypothesisStatus;
}

export type QueryEngine = "athena" | "spark-sql";

export interface DiagnosticQuery {
  id: string;
  hypothesisId: string;
  engine: QueryEngine;
  sql: string;
  purpose: string;
}

// ─────────────────────────────────────────────────────────────
// Query Safety Guard (deterministic — read-only + cost-safe)
// Replaces v1's linter. Enforces read-only AND execution-cost rules.
// ─────────────────────────────────────────────────────────────

export interface QueryGuardResult {
  ok: boolean;
  /** human-readable reasons the query was rejected (empty when ok) */
  violations: string[];
  /** normalized SQL when ok; may include an injected LIMIT */
  normalizedSql?: string;
  /** true when the guard injected/repaired something (e.g. added LIMIT) */
  rewritten?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Raw execution result (from executor) + Compacted digest (to models)
// ─────────────────────────────────────────────────────────────

export interface QueryExecutionResult {
  queryId: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  bytesScanned?: number;
  runtimeMs: number;
  engine: QueryEngine;
  truncated?: boolean;
  error?: string;
}

export interface ColumnStat {
  name: string;
  /** value-type label only: "number" | "string" | "boolean" | "null" | "mixed" */
  type: string;
  min?: number | string;
  max?: number | string;
  avg?: number;
  nulls?: number;
  distinct?: number;
  /**
   * True when the distinct-value scan hit its row cap, so `distinct` is a
   * LOWER BOUND on the true distinct count rather than an exact value.
   * Kept as its own flag so `type` stays a machine-readable value-type
   * label — callers must not encode caveats into `type`.
   */
  distinctCapped?: boolean;
}

export interface ResultStats {
  columns: ColumnStat[];
  dateSpan?: { column: string; min: string; max: string };
}

/**
 * The token-saver. Only a CompactResult (<=10 sample rows + deterministic
 * stats) is ever handed to a model — never the raw QueryExecutionResult.rows.
 */
export interface CompactResult {
  queryId: string;
  columns: string[];
  /** <= MAX_SAMPLE_ROWS (default 10): head+tail sample, not the full set */
  sampleRows: Array<Record<string, unknown>>;
  stats: ResultStats;
  rowCount: number;
  bytesScanned?: number;
  runtimeMs: number;
  /** true when rows beyond the sample were omitted */
  truncated: boolean;
  error?: string;
}

/** Default cap on rows shown to a model. */
export const MAX_SAMPLE_ROWS = 10;

/**
 * Hard cap on rows an executor returns to the caller, regardless of how
 * many the query produced. Lives here (not in the Athena client) so the
 * demo executor can share the exact same cap without importing the AWS
 * module graph — demo mode must stay service-free.
 */
export const MAX_ROWS = 1000;

// ─────────────────────────────────────────────────────────────
// Analyst verdict
// ─────────────────────────────────────────────────────────────

export type StepVerdict = "confirmed" | "refuted" | "inconclusive";

export interface StepAnalysis {
  verdict: StepVerdict;
  reasoning: string;
  /** advisory only — the PLANNER decides the actual next action in v2 */
  hint?: "conclude" | "next-hypothesis" | "refine-query";
}

// ─────────────────────────────────────────────────────────────
// Planner decision (the Opus brain's per-turn output)
// ─────────────────────────────────────────────────────────────

export type PlannerAction = "gen_query" | "read_repo" | "conclude";

export interface PlannerDecision {
  action: PlannerAction;
  reasoning: string;
  /** present when action === "gen_query" */
  hypothesis?: Hypothesis;
  /** present when action === "read_repo": what area/file to examine */
  focus?: string;
}

/** Compact evidence line fed back to the planner each turn (keeps its context small). */
export interface PlannerEvidence {
  kind: "query" | "repo";
  hypothesisId?: string;
  summary: string;
}

// ─────────────────────────────────────────────────────────────
// Investigation state
// ─────────────────────────────────────────────────────────────

export interface RepoInsight {
  focus: string;
  insight: string;
}

export interface InvestigationStep {
  hypothesis: Hypothesis;
  query: DiagnosticQuery;
  guard: QueryGuardResult;
  /** full result kept for the record (UI/report); NOT sent to models */
  execution?: QueryExecutionResult;
  /** the digest actually fed to the analyst/planner */
  compact?: CompactResult;
  analysis?: StepAnalysis;
}

export interface EvidenceItem {
  hypothesisId: string;
  queryId: string;
  finding: string;
}

export interface RootCauseReport {
  rootCause: string;
  confidence: number;
  evidence: EvidenceItem[];
  suggestedFix: string;
  caveats: string[];
}

export type InvestigationStatus =
  | "ingesting"
  | "investigating"
  | "reporting"
  | "done"
  | "error"
  | "cancelled";

export interface Investigation {
  id: string;
  symptom: string;
  mode: ExecutionMode;
  pipeline: PipelineContext;
  decisions: PlannerDecision[];
  hypotheses: Hypothesis[];
  steps: InvestigationStep[];
  repoInsights: RepoInsight[];
  report?: RootCauseReport;
  status: InvestigationStatus;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Execution backends (live AWS vs demo fixtures) — identical interfaces
// ─────────────────────────────────────────────────────────────

export type ExecutionMode = "live" | "demo";

export interface QueryExecutor {
  readonly mode: ExecutionMode;
  execute(query: DiagnosticQuery): Promise<QueryExecutionResult>;
}

export interface CatalogProvider {
  readonly mode: ExecutionMode;
  listTables(): Promise<TableRef[]>;
  describeTable(database: string, name: string): Promise<TableRef>;
}

export interface PipelineIngestor {
  readonly mode: ExecutionMode;
  ingest(source: IngestSource): Promise<PipelineContext>;
}

export interface IngestSource {
  repoUrl?: string;
  scenarioId?: string;
}

// ─────────────────────────────────────────────────────────────
// Lamatic reasoning client — one method per tiered flow.
//   plan()         -> flow: sparktrace-planner    (Opus 4.8)
//   readRepo()     -> flow: sparktrace-repo-reader (Sonnet 5)
//   generateQuery()-> flow: sparktrace-query-gen  (Sonnet 5 / Haiku 4.5)
//   analyze()      -> flow: sparktrace-analyst     (Haiku 4.5)
//   report()       -> flow: sparktrace-reporter    (Sonnet 5)
// ─────────────────────────────────────────────────────────────

export interface LamaticReasoner {
  /** planner (Opus): decide the next action from the evidence so far */
  plan(input: {
    symptom: string;
    pipeline: PipelineContext;
    evidence: PlannerEvidence[];
    hypothesesTried: Hypothesis[];
  }): Promise<PlannerDecision>;

  /** repo reader (Sonnet): deep-dive a focus area of the pipeline */
  readRepo(input: {
    symptom: string;
    pipeline: PipelineContext;
    focus: string;
  }): Promise<RepoInsight>;

  /** query generator (Sonnet/Haiku): hypothesis + schema -> read-only SQL */
  generateQuery(input: {
    symptom: string;
    hypothesis: Hypothesis;
    tables: TableRef[];
    engine: QueryEngine;
  }): Promise<DiagnosticQuery>;

  /** analyst (Haiku): compacted result -> verdict */
  analyze(input: {
    symptom: string;
    hypothesis: Hypothesis;
    query: DiagnosticQuery;
    result: CompactResult;
  }): Promise<StepAnalysis>;

  /** reporter (Sonnet): synthesize the root-cause report */
  report(input: { investigation: Investigation }): Promise<RootCauseReport>;
}

// ─────────────────────────────────────────────────────────────
// Orchestrator (apps/actions/orchestrate.ts)
// ─────────────────────────────────────────────────────────────

export interface OrchestratorDeps {
  reasoner: LamaticReasoner;
  ingestor: PipelineIngestor;
  catalog: CatalogProvider;
  executor: QueryExecutor;
  /** read-only + cost gate — MUST run before executor.execute() */
  guardQuery: (query: DiagnosticQuery) => QueryGuardResult;
  /** compaction — MUST run before any result reaches a model */
  compact: (result: QueryExecutionResult) => CompactResult;
  /** max planner iterations before a forced report (default 6) */
  stepBudget?: number;
}

export interface RunInvestigationInput {
  symptom: string;
  source: IngestSource;
  mode: ExecutionMode;
}

/** Streams investigation state as the planner loop progresses (for the UI). */
export type InvestigationEvent =
  | { type: "status"; status: InvestigationStatus }
  | { type: "pipeline"; pipeline: PipelineContext }
  | { type: "decision"; decision: PlannerDecision }
  | { type: "repo-insight"; insight: RepoInsight }
  | { type: "step"; step: InvestigationStep }
  | { type: "report"; report: RootCauseReport }
  | { type: "error"; message: string };
