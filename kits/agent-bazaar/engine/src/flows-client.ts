import "dotenv/config";
import { Lamatic } from "lamatic";

let client: Lamatic | null = null;

/** Get or construct the Lamatic client. */
function getClient(): Lamatic {
  if (!client) {
    const apiKey = process.env.LAMATIC_API_KEY || "";
    const projectId = process.env.LAMATIC_PROJECT_ID || "";
    const endpoint = process.env.LAMATIC_API_URL || "";
    if (!apiKey || !projectId || !endpoint) {
      console.warn(
        "[flows-client] Missing LAMATIC_API_KEY, LAMATIC_PROJECT_ID, or LAMATIC_API_URL — flows will use fallbacks",
      );
    }
    client = new Lamatic({
      apiKey,
      projectId,
      endpoint,
    });
  }
  return client;
}

const FLOWS = {
  postBounty: process.env.FLOW_POST_BOUNTY || "",
  generateBid: process.env.FLOW_GENERATE_BID || "",
  executeTask: process.env.FLOW_EXECUTE_TASK || "",
  qaJudge: process.env.FLOW_QA_JUDGE || "",
  updateReputation: process.env.FLOW_UPDATE_REPUTATION || "",
};

const DEFAULT_TIMEOUT_MS = Number(process.env.FLOW_TIMEOUT_MS || "10000");

// Per-flow deadlines: bids and QA must resolve fast so the pipeline keeps
// moving; artifact generation gets room since quality matters most there.
const FLOW_TIMEOUTS: Record<string, number> = {
  generateBid: Number(process.env.FLOW_TIMEOUT_BIDS || "6000"),
  qaJudge: Number(process.env.FLOW_TIMEOUT_QA || "6000"),
  executeTask: Number(process.env.FLOW_TIMEOUT_EXECUTE || "20000"),
  postBounty: Number(process.env.FLOW_TIMEOUT_POST || "8000"),
  updateReputation: Number(process.env.FLOW_TIMEOUT_REPUTATION || "8000"),
};

async function withTimeout<T>(promise: Promise<T>, label: string, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer!));
}

// Circuit breaker: when the provider rate-limits us (Groq 429s), honor its
// "try again in …" instead of hammering it — instant fallbacks until then.
let rateLimitedUntil = 0;
let rateLimitNoticeAt = 0;

const RATE_LIMIT_RE = /429|rate limit|too many requests/i;
const RETRY_IN_RE = /try again in (?:(\d+)\s*m\s*)?([\d.]+)\s*s/i;

/** Return provider rate-limit circuit-breaker status. */
export function getLlmStatus(): { degraded: boolean; retryAfterMs: number } {
  const ms = rateLimitedUntil - Date.now();
  return { degraded: ms > 0, retryAfterMs: Math.max(0, ms) };
}

/** Open the rate-limit circuit breaker. */
function noteRateLimit(message: string): void {
  const m = RETRY_IN_RE.exec(message);
  const ms = m
    ? Math.min(15 * 60_000, (Number(m[1] || 0) * 60 + Number(m[2])) * 1000)
    : 5 * 60_000;
  rateLimitedUntil = Date.now() + ms;
  if (Date.now() - rateLimitNoticeAt > 60_000) {
    rateLimitNoticeAt = Date.now();
    console.log(`[llm] provider rate-limited — instant fallbacks for ~${Math.max(1, Math.round(ms / 60_000))}m`);
  }
}

/** Call a flow with timeout and fallback. */
async function callWithFallback(
  flowId: string,
  flowKey: keyof typeof FLOW_TIMEOUTS,
  input: Record<string, unknown>,
  fallback: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (Date.now() < rateLimitedUntil) return fallback;
  try {
    const result = await withTimeout(
      getClient().executeFlow(flowId, input),
      `flow:${flowId}`,
      FLOW_TIMEOUTS[flowKey] ?? DEFAULT_TIMEOUT_MS,
    );
    if (result.status === "error" || !result.result) {
      const message = String(result.message ?? "flow error");
      if (RATE_LIMIT_RE.test(message)) noteRateLimit(message);
      else console.log(`  [flow] ${flowId}: ${message}`);
      return fallback;
    }
    return typeof result.result === "string" ? JSON.parse(result.result) : result.result;
  } catch (err) {
    const message = (err as Error).message;
    if (RATE_LIMIT_RE.test(message)) noteRateLimit(message);
    else console.log(`  [flow] ${flowId}: ${message}`);
    return fallback;
  }
}

export interface PostBountyOutput {
  goal: string;
  budget: number;
  rubric: Record<string, unknown>;
}

export interface GenerateBidOutput {
  price: number;
  eta_hours: number;
  pitch: string;
  capability: string;
}

export interface ExecuteTaskOutput {
  artifact: Record<string, unknown>;
  winnerBidId: string;
  escrowId: string;
  amount: number;
  lockRef: string;
  scores: Record<string, unknown>;
  reason: string;
}

export interface QaJudgeOutput {
  score: number;
  verdict: string;
  rationale: string;
  action: string;
  receiptId?: string;
  newAttempt: number;
  reason: string;
}

export interface UpdateReputationOutput {
  agentId: string;
  delta: number;
  newScore: number;
  outcome: string;
}

/** Invoke the post-bounty flow with fallback rubric. */
export async function postBounty(input: {
  goal: string;
  budget: number;
}): Promise<PostBountyOutput> {
  const result = await callWithFallback(FLOWS.postBounty, "postBounty", input as Record<string, unknown>, {
    goal: input.goal,
    budget: input.budget,
    rubric: {
      criteria: [
        { name: "Completeness", weight: 0.4, description: "Covers all requirements" },
        { name: "Accuracy", weight: 0.3, description: "Factually correct" },
        { name: "Quality", weight: 0.3, description: "Professional standard" },
      ],
      maxScore: 1.0,
    },
  });
  return result as unknown as PostBountyOutput;
}

/** Invoke the generate-bid flow with priced fallback. */
export async function generateBid(input: {
  bounty: Record<string, unknown>;
  agentProfile: Record<string, unknown>;
  openBids: Record<string, unknown>;
}): Promise<GenerateBidOutput> {
  const budget = (input.bounty.budget as number) || 1000;
  const rep = (input.agentProfile.reputation as number) || 0.5;
  const fallbackPrice = Math.round(budget * (0.5 + (1 - rep) * 0.4));
  const result = await callWithFallback(FLOWS.generateBid, "generateBid", input as Record<string, unknown>, {
    price: fallbackPrice,
    eta_hours: Math.round(2 + (1 - rep) * 6),
    pitch: `I can handle this task efficiently with my ${(input.agentProfile.specialty as string) || "general"} expertise.`,
    capability: `capabilities/${(input.agentProfile.specialty as string) || "general"}.md`,
  });
  return result as unknown as GenerateBidOutput;
}

/** Invoke the execute-task flow with winner fallback. */
export async function executeTask(input: {
  bounty: Record<string, unknown>;
  bids: Record<string, unknown>;
  capability: string;
}): Promise<ExecuteTaskOutput> {
  const bidsList = (input.bids.bids as Record<string, unknown>[]) || [];
  const winner = bidsList.reduce(
    (best, bid) => {
      const bestScore =
        ((best.reputation as number) || 0.5) * 0.6 +
        (1 - ((best.price as number) || 500) / ((input.bounty.budget as number) || 1000)) * 0.4;
      const bidScore =
        ((bid.reputation as number) || 0.5) * 0.6 +
        (1 - ((bid.price as number) || 500) / ((input.bounty.budget as number) || 1000)) * 0.4;
      return bidScore > bestScore ? bid : best;
    },
    bidsList[0] || {} as Record<string, unknown>,
  );

  const result = await callWithFallback(FLOWS.executeTask, "executeTask", input as Record<string, unknown>, {
    artifact: { result: `Completed artifact for: ${input.bounty.goal}`, format: "json" },
    winnerBidId: winner.id || "bid-fallback",
    escrowId: `escrow-${Date.now()}`,
    amount: winner.price || Math.round((input.bounty.budget as number) * 0.7),
    lockRef: `lock-${Date.now()}`,
    scores: { price: 0.8, reputation: 0.9, fit: 0.85 },
    reason: "Selected based on best reputation-weighted price score.",
  });
  return result as unknown as ExecuteTaskOutput;
}

/** Invoke the QA judge flow with fail-closed fallback. */
export async function qaJudge(input: {
  bounty: Record<string, unknown>;
  rubric: Record<string, unknown>;
  artifact: Record<string, unknown> | string;
  attempt: number;
  escrow: Record<string, unknown>;
}): Promise<QaJudgeOutput> {
  // Fail closed: when the QA flow is unavailable the bounty must NOT settle on
  // an unreviewed pass. Return a non-settling fail so the pipeline retries the
  // delivery (and refunds after max attempts) instead of paying out blind.
  // Open breaker: hold the delivery without consuming a QA attempt so the
  // pipeline waits instead of burning retries on never-judged work.
  if (getLlmStatus().degraded) {
    return {
      score: 0,
      verdict: "fail",
      rationale: "[DEGRADED] LLM breaker open — QA on hold; delivery retained without consuming an attempt.",
      action: "hold",
      newAttempt: input.attempt,
      reason: "",
    };
  }
  const result = await callWithFallback(FLOWS.qaJudge, "qaJudge", input as Record<string, unknown>, {
    score: 0,
    verdict: "fail",
    rationale: "[DEGRADED] QA flow unavailable — automatic fail; bounty retained for retry/review.",
    action: "retry",
    newAttempt: input.attempt + 1,
    reason: "",
  });
  return result as unknown as QaJudgeOutput;
}

/** Invoke the update-reputation flow with clamped fallback. */
export async function updateReputation(input: {
  agentId: string;
  outcome: "pass" | "fail";
  currentReputation?: number;
}): Promise<UpdateReputationOutput> {
  const delta = input.outcome === "pass" ? 0.05 : -0.1;
  const current = Number.isFinite(Number(input.currentReputation))
    ? Number(input.currentReputation)
    : 0.5;
  const result = await callWithFallback(FLOWS.updateReputation, "updateReputation", input as Record<string, unknown>, {
    agentId: input.agentId,
    delta,
    newScore: Math.max(0, Math.min(1, current + delta)),
    outcome: input.outcome,
  });
  return result as unknown as UpdateReputationOutput;
}
