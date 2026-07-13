import { Lamatic } from 'lamatic';
import type {
  SuiteGeneratorInput,
  JudgeInput,
  ReportInput,
} from '@/types';

/**
 * Single Lamatic SDK client + typed wrappers for each FlowGuard flow, plus the
 * target-flow executor. All flow ids come from env (server-side only).
 *
 * Design note: the TARGET flow is invoked through the same SDK by its id — there
 * is no wrapper flow. That keeps FlowGuard target-agnostic (it can evaluate any
 * flow in the user's project) and avoids an extra hop.
 */

// ── Fail fast on missing connection env ──
const requiredEnv = ['LAMATIC_API_URL', 'LAMATIC_PROJECT_ID', 'LAMATIC_API_KEY'];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env variable: ${key}`);
  }
});

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  apiKey: process.env.LAMATIC_API_KEY!,
});

/** Read a FlowGuard flow id from env, or throw a clear error naming the missing var. */
function flowId(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`❌ Missing required flow id env variable: ${key}`);
  return v;
}

/**
 * The SDK sometimes returns the flow output under `.result`, sometimes at the top
 * level, sometimes under `.data`. Unwrap to the actual output object robustly.
 */
/** Surface Lamatic API errors (e.g. 403 Access Denied) as thrown errors. */
function assertOk(res: unknown): void {
  const r = res as Record<string, unknown> | null | undefined;
  if (r && typeof r === 'object' && r.status === 'error') {
    throw new Error(
      `Lamatic API ${r.statusCode ?? ''}: ${r.message ?? 'request failed'}`.trim()
    );
  }
}

function unwrap<T = Record<string, unknown>>(res: unknown): T {
  const r = res as Record<string, unknown> | null | undefined;
  if (r && typeof r === 'object') {
    if (r.result != null) return r.result as T;
    if (r.data != null) return r.data as T;
  }
  return (r ?? {}) as T;
}

/**
 * Coerce a value into an array of cases. Accepts a real array, a JSON string of
 * an array, a JSON string of `{ cases: [...] }`, or the model's raw text with
 * ```json fences. Also handles the whole LLM output object ({ generatedResponse }).
 */
function coerceArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.generatedResponse === 'string') return coerceArray(o.generatedResponse);
    if (Array.isArray(o.cases)) return o.cases;
    return [];
  }
  if (typeof v === 'string') {
    let t = v.trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    if (t[0] !== '{' && t[0] !== '[') {
      const b = t.indexOf('{');
      if (b >= 0) t = t.slice(b);
    }
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed : (parsed?.cases ?? []);
    } catch {
      return [];
    }
  }
  return [];
}

/* ────────────────────────  FlowGuard's own flows  ─────────────────────── */

export async function runSuiteGenerator(input: SuiteGeneratorInput) {
  const res = await lamaticClient.executeFlow(flowId('FLOW_ID_SUITE_GENERATOR'), {
    flowDescription: input.flowDescription,
    inputSchema: input.inputSchema,
    sampleInput: input.sampleInput,
    sampleOutput: input.sampleOutput,
    numCases: String(input.numCases),
    categories: input.categories.join(', '),
  });
  const out = unwrap<{ cases?: unknown; count?: number }>(res);
  const cases = coerceArray(out.cases);
  return { cases, count: out.count ?? cases.length };
}

export async function runJudge(input: JudgeInput) {
  const res = await lamaticClient.executeFlow(flowId('FLOW_ID_JUDGE'), {
    caseInput: input.caseInput,
    expectedBehavior: input.expectedBehavior,
    actualOutput: input.actualOutput,
    targetConstitutionExcerpt: input.targetConstitutionExcerpt ?? '',
    rubricVersion: input.rubricVersion,
  });
  return unwrap<Record<string, unknown>>(res);
}

export async function runReportSummarizer(input: ReportInput) {
  const res = await lamaticClient.executeFlow(flowId('FLOW_ID_REPORT_SUMMARIZER'), {
    verdict: input.verdict,
    totals: JSON.stringify(input.totals ?? {}),
    worstFailures: JSON.stringify(input.worstFailures ?? []),
    baselineDeltas: JSON.stringify(input.baselineDeltas ?? {}),
  });
  const out = unwrap<{ summaryMarkdown?: string }>(res);
  return { summaryMarkdown: out.summaryMarkdown ?? '' };
}

/** Optional red-team generator (only if its env id is set). */
export function redTeamEnabled(): boolean {
  return !!process.env.FLOW_ID_RED_TEAM_GENERATOR;
}

export async function runRedTeamGenerator(input: {
  flowDescription: string;
  constitutionText: string;
  numProbes: number;
}) {
  const res = await lamaticClient.executeFlow(flowId('FLOW_ID_RED_TEAM_GENERATOR'), {
    flowDescription: input.flowDescription,
    constitutionText: input.constitutionText,
    numProbes: String(input.numProbes),
  });
  const out = unwrap<{ cases?: unknown; count?: number }>(res);
  const cases = coerceArray(out.cases);
  return { cases, count: out.count ?? cases.length };
}

/* ────────────────────────  The target flow (any id)  ──────────────────── */

/** Execute an arbitrary target flow by id with a case's input object. */
export async function executeTargetFlow(
  targetFlowId: string,
  input: Record<string, unknown>
): Promise<{ result: unknown; raw: string }> {
  const res = await lamaticClient.executeFlow(targetFlowId, input);
  assertOk(res);
  const result = (res as { result?: unknown })?.result ?? res;
  const raw =
    typeof result === 'string' ? result : JSON.stringify(result ?? null);
  return { result, raw };
}
