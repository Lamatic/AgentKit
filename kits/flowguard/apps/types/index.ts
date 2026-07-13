/**
 * FlowGuard — core type & schema contracts.
 *
 * Everything in the kit depends on these shapes. They are the single source of
 * truth for what a test case, a run, a judgment, and a verdict are. Flows return
 * JSON that is parsed against the Zod schemas below (LLM output is untrusted
 * input — always parsed, never assumed).
 */

import { z } from 'zod';

/* ─────────────────────────────  Test cases  ───────────────────────────── */

export const CASE_CATEGORIES = [
  'happy_path',
  'edge_case',
  'ambiguous',
  'out_of_scope',
  'adversarial',
] as const;

export type CaseCategory = (typeof CASE_CATEGORIES)[number];

/**
 * A single test case. `expectedBehavior` is a natural-language oracle
 * ("must refuse and redirect", "must include a citation") rather than an
 * exact-match string — this is what makes judging generalize across arbitrary
 * target flows.
 */
export const TestCaseSchema = z.object({
  id: z.string(),
  category: z.enum(CASE_CATEGORIES),
  input: z.record(z.string(), z.unknown()),
  expectedBehavior: z.string().min(1),
  rationale: z.string().default(''),
});
export type TestCase = z.infer<typeof TestCaseSchema>;

/** A suite is immutable once pinned. Comparisons are only valid within a version. */
export const SuiteSchema = z.object({
  id: z.string(),
  targetFlowId: z.string(),
  flowDescription: z.string(),
  version: z.number().int().positive(),
  pinned: z.boolean().default(false),
  createdAt: z.string(),
  cases: z.array(TestCaseSchema),
});
export type Suite = z.infer<typeof SuiteSchema>;

/* ────────────────────────────  Execution  ─────────────────────────────── */

export const ExecOutcome = ['ok', 'timeout', 'errored'] as const;
export type ExecOutcomeType = (typeof ExecOutcome)[number];

/** Result of running the target flow once for a single case. */
export const CaseExecutionSchema = z.object({
  caseId: z.string(),
  outcome: z.enum(ExecOutcome),
  output: z.unknown().nullable(),
  rawText: z.string().default(''),
  latencyMs: z.number().nonnegative(),
  costUsd: z.number().nonnegative().default(0),
  retries: z.number().int().nonnegative().default(0),
  error: z.string().optional(),
  truncated: z.boolean().default(false),
});
export type CaseExecution = z.infer<typeof CaseExecutionSchema>;

/* ──────────────────────────────  Judging  ─────────────────────────────── */

/** The five rubric axes. `schemaValid` is set by a deterministic code node, not the LLM. */
export const RUBRIC_AXES = [
  'taskSuccess',
  'faithfulness',
  'toneConstitution',
  'safety',
] as const;
export type RubricAxis = (typeof RUBRIC_AXES)[number];

export const JUDGE_VERDICTS = ['pass', 'borderline', 'fail'] as const;
export type JudgeVerdict = (typeof JUDGE_VERDICTS)[number];

/**
 * Judgment of one (input, expectedBehavior, actualOutput) triple.
 * Rationales come *before* scores in the flow output (chain-of-thought
 * ordering improves judge quality); `schemaValid` is deterministic.
 */
export const JudgmentSchema = z.object({
  caseId: z.string(),
  rationales: z.record(z.string(), z.string()).default({}),
  scores: z.object({
    taskSuccess: z.number().min(1).max(5),
    faithfulness: z.number().min(1).max(5),
    toneConstitution: z.number().min(1).max(5),
    safety: z.number().min(1).max(5),
  }),
  schemaValid: z.boolean(),
  verdict: z.enum(JUDGE_VERDICTS),
  confidence: z.number().min(0).max(1).default(0.5),
  rubricVersion: z.string().default('v1'),
});
export type Judgment = z.infer<typeof JudgmentSchema>;

/* ───────────────────────────────  Runs  ───────────────────────────────── */

export const RUN_STAGES = [
  'GENERATE',
  'REVIEW',
  'EXECUTE',
  'JUDGE',
  'AGGREGATE',
  'REPORT',
  'DONE',
] as const;
export type RunStage = (typeof RUN_STAGES)[number];

/** One judged case = execution + judgment, joined for the run matrix. */
export const JudgedCaseSchema = z.object({
  testCase: TestCaseSchema,
  execution: CaseExecutionSchema,
  judgment: JudgmentSchema.nullable(),
});
export type JudgedCase = z.infer<typeof JudgedCaseSchema>;

export const RunSchema = z.object({
  id: z.string(),
  suiteId: z.string(),
  suiteVersion: z.number().int().positive(),
  targetFlowId: z.string(),
  stage: z.enum(RUN_STAGES),
  isBaseline: z.boolean().default(false),
  createdAt: z.string(),
  results: z.array(JudgedCaseSchema),
  totals: z
    .object({
      cases: z.number().int().nonnegative(),
      passed: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
      borderline: z.number().int().nonnegative(),
      errored: z.number().int().nonnegative(),
      costUsd: z.number().nonnegative(),
      avgLatencyMs: z.number().nonnegative(),
    })
    .optional(),
});
export type Run = z.infer<typeof RunSchema>;

/* ─────────────────────────────  Regression  ───────────────────────────── */

export const REGRESSION_VERDICTS = ['IMPROVED', 'NO_CHANGE', 'REGRESSED'] as const;
export type RegressionVerdict = (typeof REGRESSION_VERDICTS)[number];

export const BaselineDiffSchema = z.object({
  baselineRunId: z.string(),
  candidateRunId: z.string(),
  verdict: z.enum(REGRESSION_VERDICTS),
  meanScoreDelta: z.number(),
  flippedToFail: z.array(z.string()), // case ids that passed → now fail
  flippedToPass: z.array(z.string()), // case ids that failed → now pass
  perCase: z.array(
    z.object({
      caseId: z.string(),
      baselineMean: z.number().nullable(),
      candidateMean: z.number().nullable(),
      delta: z.number().nullable(),
    })
  ),
});
export type BaselineDiff = z.infer<typeof BaselineDiffSchema>;

/* ─────────────────────  Flow I/O contracts (SDK)  ─────────────────────── */

/** Input the app sends to the `suite-generator` flow. */
export interface SuiteGeneratorInput {
  flowDescription: string;
  inputSchema: string;
  sampleInput: string;
  sampleOutput: string;
  numCases: number;
  categories: CaseCategory[];
}

/** Input the app sends to the `judge` flow (per case). */
export interface JudgeInput {
  caseInput: string;
  expectedBehavior: string;
  actualOutput: string;
  targetConstitutionExcerpt?: string;
  rubricVersion: string;
}

/** Input the app sends to the `report-summarizer` flow. */
export interface ReportInput {
  verdict: RegressionVerdict | 'NONE';
  totals: unknown;
  worstFailures: unknown;
  baselineDeltas: unknown;
}

/* ─────────────────────────  API response envelope  ────────────────────── */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}
