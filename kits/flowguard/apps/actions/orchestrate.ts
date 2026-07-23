'use server';

import { randomUUID } from 'crypto';
import {
  runSuiteGenerator,
  runJudge,
  runReportSummarizer,
  runRedTeamGenerator,
  redTeamEnabled,
  executeTargetFlow,
} from '@/lib/lamatic-client';
import { runPool } from '@/lib/pool';
import {
  computeTotals,
  computeBaselineDiff,
  worstFailures,
} from '@/lib/verdict';
import { cache, execCacheKey, judgeCacheKey } from '@/lib/cache';
import { store } from '@/lib/store';
import {
  TestCaseSchema,
  JudgmentSchema,
  type ApiResponse,
  type Suite,
  type TestCase,
  type Run,
  type JudgedCase,
  type CaseExecution,
  type Judgment,
  type CaseCategory,
} from '@/types';

const RUBRIC_VERSION = 'v1';

/**
 * Normalize raw model-generated cases into valid TestCases. Assigns a stable id
 * (the flows no longer do this — it's done here so the flow graph stays simple),
 * coerces the input to an object, drops cases with no behavioral oracle.
 */
function normalizeCases(
  rawCases: unknown[],
  forceCategory?: string
): TestCase[] {
  const out: TestCase[] = [];
  for (const raw of rawCases ?? []) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;

    const expectedBehavior =
      typeof c.expectedBehavior === 'string' ? c.expectedBehavior.trim() : '';
    if (!expectedBehavior) continue;

    let input = c.input;
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input);
      } catch {
        input = { value: input };
      }
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};

    const candidate = {
      id: 'case_' + String(out.length + 1).padStart(3, '0'),
      category: forceCategory ?? c.category,
      input,
      expectedBehavior,
      rationale: typeof c.rationale === 'string' ? c.rationale : '',
    };

    const parsed = TestCaseSchema.safeParse(candidate);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/* ─────────────────────────  Setup / connectivity  ─────────────────────── */

export interface SetupInput {
  targetFlowId: string;
  flowDescription: string;
  inputSchema: string;
  sampleInput: string;
  sampleOutput: string;
}

/** Ping the target flow with the sample input to validate connectivity before anything else. */
export async function checkConnectivity(
  input: SetupInput
): Promise<ApiResponse<{ ok: boolean; sample: unknown }>> {
  try {
    if (!input.targetFlowId?.trim())
      return { success: false, error: 'Target flow id is required' };
    let parsed: Record<string, unknown> = {};
    try {
      parsed = input.sampleInput ? JSON.parse(input.sampleInput) : {};
    } catch {
      return { success: false, error: 'Sample input must be valid JSON' };
    }
    const { result } = await executeTargetFlow(input.targetFlowId, parsed);
    return { success: true, data: { ok: true, sample: result } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Could not reach the target flow',
    };
  }
}

/* ─────────────────────────────  GENERATE  ─────────────────────────────── */

export async function generateSuite(
  input: SetupInput & { numCases?: number; categories?: CaseCategory[] }
): Promise<ApiResponse<Suite>> {
  try {
    const categories: CaseCategory[] = input.categories ?? [
      'happy_path',
      'edge_case',
      'ambiguous',
      'out_of_scope',
      'adversarial',
    ];

    const raw = await runSuiteGenerator({
      flowDescription: input.flowDescription,
      inputSchema: input.inputSchema,
      sampleInput: input.sampleInput,
      sampleOutput: input.sampleOutput,
      numCases: input.numCases ?? 18,
      categories,
    });

    const cases = normalizeCases(raw.cases);
    if (!cases.length)
      return { success: false, error: 'Suite generator returned no valid cases' };

    const suite: Suite = {
      id: 'suite_' + randomUUID().slice(0, 8),
      targetFlowId: input.targetFlowId,
      flowDescription: input.flowDescription,
      version: 1,
      pinned: false,
      createdAt: new Date().toISOString(),
      cases,
    };
    store.saveSuite(suite);
    return { success: true, data: suite, timestamp: new Date().toISOString() };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Suite generation failed',
    };
  }
}

export async function isRedTeamEnabled(): Promise<boolean> {
  return redTeamEnabled();
}

/** Generate an adversarial-only suite via the red-team flow, reusing the normal run pipeline. */
export async function generateRedTeamSuite(
  input: SetupInput & { numProbes?: number; constitutionText?: string }
): Promise<ApiResponse<Suite>> {
  try {
    if (!redTeamEnabled())
      return { success: false, error: 'Red-team flow not configured (set FLOW_ID_RED_TEAM_GENERATOR)' };

    const raw = await runRedTeamGenerator({
      flowDescription: input.flowDescription,
      constitutionText: input.constitutionText ?? '',
      numProbes: input.numProbes ?? 10,
    });

    const cases = normalizeCases(raw.cases, 'adversarial');
    if (!cases.length)
      return { success: false, error: 'Red-team generator returned no valid probes' };

    const suite: Suite = {
      id: 'suite_rt_' + randomUUID().slice(0, 8),
      targetFlowId: input.targetFlowId,
      flowDescription: input.flowDescription,
      version: 1,
      pinned: false,
      createdAt: new Date().toISOString(),
      cases,
    };
    store.saveSuite(suite);
    return { success: true, data: suite, timestamp: new Date().toISOString() };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Red-team generation failed',
    };
  }
}

/** Persist edited cases and pin the suite. A pinned suite is immutable; editing bumps the version. */
export async function pinSuite(
  suiteId: string,
  editedCases: TestCase[]
): Promise<ApiResponse<Suite>> {
  const existing = store.getSuite(suiteId);
  if (!existing) return { success: false, error: 'Suite not found' };

  const cases: TestCase[] = [];
  for (const c of editedCases) {
    const parsed = TestCaseSchema.safeParse(c);
    if (parsed.success) cases.push(parsed.data);
  }
  const bumped = existing.pinned ? existing.version + 1 : existing.version;
  const suite: Suite = {
    ...existing,
    id: existing.pinned ? 'suite_' + randomUUID().slice(0, 8) : existing.id,
    version: bumped,
    pinned: true,
    cases,
    createdAt: new Date().toISOString(),
  };
  store.saveSuite(suite);
  return { success: true, data: suite };
}

/* ────────────────────────  EXECUTE + JUDGE  ───────────────────────────── */

const truncate = (s: string, max = 8000) =>
  s.length > max ? s.slice(0, max / 2) + '\n…[truncated]…\n' + s.slice(-max / 2) : s;

async function executeCase(
  targetFlowId: string,
  tc: TestCase
): Promise<CaseExecution> {
  const key = execCacheKey(targetFlowId, tc.input);
  const cached = cache.get<CaseExecution>(key);
  if (cached) return { ...cached, caseId: tc.id };

  const [res] = await runPool(
    [() => executeTargetFlow(targetFlowId, tc.input)],
    { concurrency: 1, timeoutMs: 60_000, maxRetries: 1 }
  );

  const rawText = res.outcome === 'ok' ? truncate((res.value as { raw: string }).raw) : '';
  const exec: CaseExecution = {
    caseId: tc.id,
    outcome: res.outcome,
    output: res.outcome === 'ok' ? (res.value as { result: unknown }).result : null,
    rawText,
    latencyMs: res.latencyMs,
    costUsd: 0,
    retries: res.retries,
    error: res.error,
    truncated: res.outcome === 'ok' && (res.value as { raw: string }).raw.length > 8000,
  };
  if (exec.outcome === 'ok') cache.set(key, exec);
  return exec;
}

async function judgeCase(
  tc: TestCase,
  exec: CaseExecution,
  constitutionExcerpt = ''
): Promise<Judgment | null> {
  if (exec.outcome !== 'ok') return null;
  const key = judgeCacheKey(exec.rawText, tc.expectedBehavior, RUBRIC_VERSION);
  const cached = cache.get<Judgment>(key);
  if (cached) return { ...cached, caseId: tc.id };

  const raw = await runJudge({
    caseInput: JSON.stringify(tc.input),
    expectedBehavior: tc.expectedBehavior,
    actualOutput: exec.rawText,
    targetConstitutionExcerpt: constitutionExcerpt,
    rubricVersion: RUBRIC_VERSION,
  });

  const judgment = parseJudgeResult(raw, tc.id);
  if (!judgment) return null;
  cache.set(key, judgment);
  return judgment;
}

/**
 * The judge flow returns the LLM's rubric JSON as a string (`judgeRaw`) plus the
 * deterministic `schemaValid` and echoed `rubricVersion`. Parse the string
 * robustly and merge into a Judgment. Kept here so the Studio flow stays simple
 * (no in-flow parsing node needed).
 */
function parseJudgeResult(raw: Record<string, unknown>, caseId: string): Judgment | null {
  let judge: unknown =
    (raw?.judgeRaw as unknown) ??
    (raw?.generatedResponse as unknown) ??
    raw;

  if (typeof judge === 'string') {
    let t = judge.trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    if (t[0] !== '{' && t[0] !== '[') {
      const b = t.indexOf('{');
      if (b >= 0) t = t.slice(b);
    }
    try {
      judge = JSON.parse(t);
    } catch {
      return null;
    }
  }

  const j = (judge ?? {}) as Record<string, unknown>;
  const merged = {
    caseId,
    rationales: (j.rationales as Record<string, string>) ?? {},
    scores: j.scores,
    schemaValid:
      typeof raw?.schemaValid === 'boolean'
        ? raw.schemaValid
        : (j.schemaValid as boolean) ?? true,
    verdict: j.verdict,
    confidence: (j.confidence as number) ?? 0.5,
    rubricVersion: (raw?.rubricVersion as string) ?? (j.rubricVersion as string) ?? 'v1',
  };

  const parsed = JudgmentSchema.safeParse(merged);
  return parsed.success ? parsed.data : null;
}

/**
 * Run the full core loop for a suite: EXECUTE (pooled) → JUDGE (pooled) →
 * AGGREGATE. Per-case isolation means the run always completes with partial
 * results even if some cases error.
 */
export async function runEvaluation(
  suiteId: string,
  opts: { concurrency?: number; constitutionExcerpt?: string; fresh?: boolean } = {}
): Promise<ApiResponse<Run>> {
  try {
    const suite = store.getSuite(suiteId);
    if (!suite) return { success: false, error: 'Suite not found' };

    // A re-run after editing the target must not reuse cached executions/judgments.
    if (opts.fresh) cache.clear();

    // EXECUTE
    const executions = await runPool(
      suite.cases.map((tc) => () => executeCase(suite.targetFlowId, tc)),
      { concurrency: opts.concurrency ?? 4, timeoutMs: 61_000, maxRetries: 0 }
    );
    const execByCase = new Map<string, CaseExecution>();
    executions.forEach((r, i) => {
      const tc = suite.cases[i];
      execByCase.set(
        tc.id,
        (r.value as CaseExecution) ?? {
          caseId: tc.id,
          outcome: 'errored',
          output: null,
          rawText: '',
          latencyMs: r.latencyMs,
          costUsd: 0,
          retries: r.retries,
          error: r.error,
          truncated: false,
        }
      );
    });

    // JUDGE
    const judgments = await runPool(
      suite.cases.map((tc) => () =>
        judgeCase(tc, execByCase.get(tc.id)!, opts.constitutionExcerpt)
      ),
      { concurrency: opts.concurrency ?? 4, timeoutMs: 61_000, maxRetries: 0 }
    );

    // AGGREGATE
    const results: JudgedCase[] = suite.cases.map((tc, i) => ({
      testCase: tc,
      execution: execByCase.get(tc.id)!,
      judgment: (judgments[i].value as Judgment) ?? null,
    }));

    const run: Run = {
      id: 'run_' + randomUUID().slice(0, 8),
      suiteId: suite.id,
      suiteVersion: suite.version,
      targetFlowId: suite.targetFlowId,
      stage: 'DONE',
      isBaseline: false,
      createdAt: new Date().toISOString(),
      results,
      totals: computeTotals(results),
    };
    store.saveRun(run);
    return { success: true, data: run, timestamp: new Date().toISOString() };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Evaluation failed',
    };
  }
}

/* ────────────────────────  Baseline + report  ─────────────────────────── */

export async function setBaseline(runId: string): Promise<ApiResponse<null>> {
  const run = store.getRun(runId);
  if (!run) return { success: false, error: 'Run not found' };
  store.setBaseline(run);
  return { success: true, data: null };
}

export async function diffAgainstBaseline(runId: string): Promise<ApiResponse> {
  const candidate = store.getRun(runId);
  if (!candidate) return { success: false, error: 'Run not found' };
  const baseline = store.getBaseline(candidate.suiteId, candidate.suiteVersion);
  if (!baseline)
    return { success: false, error: 'No baseline set for this suite version' };
  if (baseline.id === candidate.id)
    return { success: false, error: 'This run is the baseline' };
  try {
    return { success: true, data: computeBaselineDiff(baseline, candidate) };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Diff failed',
    };
  }
}

export async function generateReport(runId: string): Promise<ApiResponse<{ markdown: string }>> {
  const run = store.getRun(runId);
  if (!run) return { success: false, error: 'Run not found' };
  const baseline = store.getBaseline(run.suiteId, run.suiteVersion);
  let verdict: string = 'NONE';
  let baselineDeltas: unknown = {};
  if (baseline && baseline.id !== run.id) {
    try {
      const diff = computeBaselineDiff(baseline, run);
      verdict = diff.verdict;
      baselineDeltas = diff;
    } catch {
      /* different suite version — leave as first-run summary */
    }
  }
  try {
    const { summaryMarkdown } = await runReportSummarizer({
      verdict: verdict as never,
      totals: run.totals,
      worstFailures: worstFailures(run, 5),
      baselineDeltas,
    });
    return { success: true, data: { markdown: summaryMarkdown } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Report generation failed',
    };
  }
}

/* ────────────────────────────  Export/import  ─────────────────────────── */

export async function exportState(): Promise<ApiResponse> {
  return { success: true, data: store.exportAll() };
}
