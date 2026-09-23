import { z } from "zod";

export const MAX_DATABASE_BYTES = 4 * 1024 * 1024;
export const MAX_QUERY_CHARACTERS = 12_000;
// Base64 expands the database by roughly one third. The HTTP envelope also
// needs room for the query and JSON escaping while remaining strictly bounded.
export const MAX_REQUEST_BODY_BYTES = 6 * 1024 * 1024;
export const MAX_RESULT_ROWS = 10_000;
export const MAX_RESULT_BYTES = 4 * 1024 * 1024;
export const MAX_EXPERIMENTS = 5;
export const BENCHMARK_WARMUP_RUNS = 1;
export const BENCHMARK_MEASURED_RUNS = 5;
export const MIN_RECOMMENDED_SPEEDUP = 1.1;
export const AGENT_CONTRACT_VERSION = "1.0" as const;

export const runModeSchema = z.enum(["demo", "live"]);
export type RunMode = z.infer<typeof runModeSchema>;

export const columnSchema = z.object({
  name: z.string().min(1),
  declaredType: z.string().min(1),
  nullable: z.boolean(),
  primaryKeyPosition: z.number().int().nonnegative(),
});
export type Column = z.infer<typeof columnSchema>;

export const indexSchema = z.object({
  name: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  unique: z.boolean(),
});
export type Index = z.infer<typeof indexSchema>;

export const tableSchema = z.object({
  name: z.string().min(1),
  columns: z.array(columnSchema),
  indexes: z.array(indexSchema),
  estimatedRows: z.number().int().nonnegative().optional(),
});
export type TableSchema = z.infer<typeof tableSchema>;

export const queryPlanStepSchema = z.object({
  id: z.number().int(),
  parentId: z.number().int(),
  detail: z.string().min(1),
});
export type QueryPlanStep = z.infer<typeof queryPlanStepSchema>;

export const queryResultSchema = z.object({
  columns: z.array(z.string()),
  rowCount: z.number().int().nonnegative(),
  ordered: z.boolean(),
  hash: z.string().min(1),
  exceededRowLimit: z.boolean(),
});
export type QueryResult = z.infer<typeof queryResultSchema>;

export const benchmarkSchema = z.object({
  warmupRuns: z.number().int().nonnegative(),
  measuredRuns: z.array(z.number().nonnegative()),
  medianMs: z.number().nonnegative(),
});
export type Benchmark = z.infer<typeof benchmarkSchema>;

export const baselineSchema = z.object({
  query: z.string().min(1),
  plan: z.array(queryPlanStepSchema),
  result: queryResultSchema,
  benchmark: benchmarkSchema,
});
export type Baseline = z.infer<typeof baselineSchema>;

export const candidateKindSchema = z.enum(["rewrite_query", "create_index"]);
export type CandidateKind = z.infer<typeof candidateKindSchema>;

export const experimentVerdictSchema = z.enum([
  "improved",
  "slower",
  "equivalent-noise",
  "guard-rejected",
  "non-equivalent",
  "execution-failed",
]);
export type ExperimentVerdict = z.infer<typeof experimentVerdictSchema>;

export const adaptationSchema = z.object({
  learnedFromEvidence: z.string().min(1).max(700),
  differsFromPrevious: z.string().min(1).max(700),
  respondsToExperiment: z.number().int().positive().optional(),
});
export type Adaptation = z.infer<typeof adaptationSchema>;

export const experimentEvidenceSchema = z.object({
  number: z.number().int().positive(),
  kind: candidateKindSchema,
  hypothesis: z.string().min(1),
  candidateSql: z.string().min(1),
  expectedPlanChange: z.string().min(1),
  verdict: experimentVerdictSchema,
  summary: z.string().min(1).max(1_000),
  plan: z.array(queryPlanStepSchema).optional(),
  result: queryResultSchema.optional(),
  benchmark: benchmarkSchema.optional(),
  equivalence: z.boolean().optional(),
  speedup: z.number().positive().optional(),
  adaptation: adaptationSchema.optional(),
  stopConditions: z.array(z.string().min(1).max(300)).min(1).max(4).optional(),
});
export type ExperimentEvidence = z.infer<typeof experimentEvidenceSchema>;

export const strategistStrategySchema = z.enum([
  "covering_index",
  "filter_first_index",
  "grouping_first_index",
  "partial_index",
  "query_rewrite",
  "revise_failed_candidate",
  "conclude",
]);
export type StrategistStrategy = z.infer<typeof strategistStrategySchema>;

export const failureClassSchema = z.enum([
  "none",
  "safety",
  "equivalence",
  "performance",
  "execution",
]);
export type FailureClass = z.infer<typeof failureClassSchema>;

export const strategistExperimentEvidenceSchema = experimentEvidenceSchema.extend({
  strategy: strategistStrategySchema.exclude(["conclude"]),
  failureClass: failureClassSchema,
  observation: z.string().min(1).max(1_000),
});
export type StrategistExperimentEvidence = z.infer<typeof strategistExperimentEvidenceSchema>;

export const strategistInputSchema = z.object({
  contractVersion: z.literal(AGENT_CONTRACT_VERSION),
  originalQuery: z.string().min(1).max(MAX_QUERY_CHARACTERS),
  schema: z.array(tableSchema).min(1),
  baseline: baselineSchema,
  experiments: z.array(strategistExperimentEvidenceSchema).max(MAX_EXPERIMENTS),
  attemptedStrategies: z.array(strategistStrategySchema.exclude(["conclude"])).max(MAX_EXPERIMENTS),
  remainingExperiments: z.number().int().min(0).max(MAX_EXPERIMENTS),
}).superRefine((input, context) => {
  if (input.experiments.length + input.remainingExperiments !== MAX_EXPERIMENTS) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["remainingExperiments"],
      message: `Experiment history and remaining budget must total ${MAX_EXPERIMENTS}.`,
    });
  }

  const evidenceStrategies = input.experiments.map((experiment) => experiment.strategy);
  if (
    evidenceStrategies.length !== input.attemptedStrategies.length
    || evidenceStrategies.some((strategy, index) => strategy !== input.attemptedStrategies[index])
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["attemptedStrategies"],
      message: "Attempted strategies must match experiment history in order.",
    });
  }
});
export type StrategistInput = z.infer<typeof strategistInputSchema>;

const strategistDecisionBaseSchema = z.object({
  contractVersion: z.literal(AGENT_CONTRACT_VERSION),
  hypothesis: z.string().min(1).max(500),
  expectedPlanChange: z.string().min(1).max(500),
  adaptation: adaptationSchema,
  stopConditions: z.array(z.string().min(1).max(300)).min(1).max(4),
});

export const strategistRewriteDecisionSchema = strategistDecisionBaseSchema.extend({
  action: z.literal("rewrite_query"),
  strategy: z.enum(["query_rewrite", "revise_failed_candidate"]),
  sql: z.string().min(1).max(MAX_QUERY_CHARACTERS),
});

export const strategistIndexDecisionSchema = strategistDecisionBaseSchema.extend({
  action: z.literal("create_index"),
  strategy: z.enum([
    "covering_index",
    "filter_first_index",
    "grouping_first_index",
    "partial_index",
    "revise_failed_candidate",
  ]),
  indexSql: z.string().min(1).max(MAX_QUERY_CHARACTERS),
});

export const strategistConcludeDecisionSchema = z.object({
  contractVersion: z.literal(AGENT_CONTRACT_VERSION),
  action: z.literal("conclude"),
  strategy: z.literal("conclude"),
  conclusionCode: z.enum([
    "winner_found",
    "budget_exhausted",
    "no_safe_distinct_experiment",
    "insufficient_evidence",
  ]),
  reasoning: z.string().min(1).max(1_000),
  evidenceUsed: z.array(z.number().int().positive()).max(MAX_EXPERIMENTS),
});

export const strategistDecisionSchema = z.discriminatedUnion("action", [
  strategistRewriteDecisionSchema,
  strategistIndexDecisionSchema,
  strategistConcludeDecisionSchema,
]);
export type StrategistDecision = z.infer<typeof strategistDecisionSchema>;

export const reviewerOutcomeSchema = z.enum(["improved", "no-proven-improvement"]);
export type ReviewerOutcome = z.infer<typeof reviewerOutcomeSchema>;

export const reviewerInputSchema = z.object({
  contractVersion: z.literal(AGENT_CONTRACT_VERSION),
  originalQuery: z.string().min(1).max(MAX_QUERY_CHARACTERS),
  baseline: baselineSchema,
  experiments: z.array(strategistExperimentEvidenceSchema).max(MAX_EXPERIMENTS),
  deterministicOutcome: reviewerOutcomeSchema,
  winningExperimentNumber: z.number().int().positive().optional(),
}).superRefine((input, context) => {
  const winner = input.experiments.find(
    (experiment) => experiment.number === input.winningExperimentNumber,
  );
  if (input.deterministicOutcome === "improved" && (!winner || winner.verdict !== "improved")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["winningExperimentNumber"],
      message: "An improved outcome must reference an improved measured experiment.",
    });
  }
  if (input.deterministicOutcome === "no-proven-improvement" && input.winningExperimentNumber) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["winningExperimentNumber"],
      message: "A no-improvement outcome cannot name a winning experiment.",
    });
  }
});
export type ReviewerInput = z.infer<typeof reviewerInputSchema>;

export const reviewerOutputSchema = z.object({
  contractVersion: z.literal(AGENT_CONTRACT_VERSION),
  headline: z.string().min(1).max(140),
  evidenceSummary: z.string().min(1).max(1_500),
  recommendation: z.string().min(1).max(1_000),
  limitations: z.array(z.string().min(1).max(400)).min(1).max(5),
  citedExperiments: z.array(z.number().int().positive()).max(MAX_EXPERIMENTS),
});
export type ReviewerOutput = z.infer<typeof reviewerOutputSchema>;

export const tuningReportSchema = z.object({
  status: z.enum(["improved", "no-proven-improvement", "invalid-input", "failed"]),
  originalQuery: z.string(),
  baseline: baselineSchema.optional(),
  experiments: z.array(strategistExperimentEvidenceSchema),
  winner: strategistExperimentEvidenceSchema.optional(),
  review: reviewerOutputSchema.optional(),
  conclusion: z.string().min(1),
  caveats: z.array(z.string()),
});
export type TuningReport = z.infer<typeof tuningReportSchema>;
