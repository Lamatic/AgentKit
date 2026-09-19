const RAW_ENGINE_URL = process.env.ENGINE_URL || "http://localhost:8787";

// SSRF guard: the engine bridge is a local companion process. Refuse to run
// against anything that isn't an explicit localhost/127.0.0.1 origin, so a
// misconfigured ENGINE_URL can never redirect server-side fetches at
// internal services.
/** Validate the engine URL against SSRF rules. */
function validateEngineUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`[engine-client] Invalid ENGINE_URL: ${raw}`);
  }
  const host = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`[engine-client] ENGINE_URL must be http(s): ${raw}`);
  }
  if (host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]") {
    throw new Error(`[engine-client] ENGINE_URL must point at localhost, got: ${raw}`);
  }
  return raw.replace(/\/$/, "");
}

export const ENGINE_URL = validateEngineUrl(RAW_ENGINE_URL);

// Server-side only: this module runs inside server actions/route handlers, so
// ENGINE_TOKEN (no NEXT_PUBLIC_ prefix) never reaches the browser. Mutating
// engine endpoints require it as a Bearer token when the engine sets one.
const ENGINE_TOKEN = process.env.ENGINE_TOKEN || "";

export interface RubricCriterion {
  name: string;
  weight: number;
  description?: string;
  passCondition?: string;
}

export interface Rubric {
  criteria: RubricCriterion[];
  maxScore?: number;
}

export interface AgentView {
  id: string;
  name: string;
  specialty?: string | null;
  reputation: number;
  wins: number;
  losses: number;
  wallet_address: string | null;
  role: "client" | "worker";
  balance: number;
  created_at: string;
}

export interface BountyView {
  id: string;
  goal: string;
  budget: number;
  status: string;
  rubric: Rubric | null;
  posted_by: string;
  created_at: string;
  updated_at: string;
}

export interface BidView {
  id: string;
  bounty_id: string;
  agent_id: string;
  price: number;
  eta_hours: number;
  pitch: string;
  capability: string;
  created_at: string;
}

export interface EscrowView {
  id: string;
  bounty_id: string;
  bid_id: string;
  amount: number;
  lock_ref: string;
  status: "locked" | "settled" | "refunded";
  created_at: string;
  settled_at: string | null;
}

export interface DeliveryView {
  id: string;
  bounty_id: string;
  attempt: number;
  artifact: unknown;
  summary: string;
  created_at: string;
}

export interface VerdictView {
  id: string;
  bounty_id: string;
  delivery_id: string;
  score: number;
  verdict: "pass" | "fail";
  rationale: string;
  rubric_hash: string;
  created_at: string;
}

export interface ReceiptView {
  id: string;
  bounty_id: string;
  escrow_id: string;
  from_agent: string;
  to_agent: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  tx_hash: string | null;
  adapter: "ledger" | "x402";
  created_at: string;
}

export interface LedgerView {
  id: string;
  agent_id: string;
  amount: number;
  balance_after: number;
  reason: string;
  ref_id: string | null;
  source: string;
  created_at: string;
}

export interface BudgetView {
  spent: number;
  remaining: number;
  daily: number;
}

export interface MarketStats {
  totalSettled: number;
  activeEscrows: number;
  escrowValue: number;
  feesCollected: number;
  avgQaScore: number;
  receipts: number;
}

export interface Market {
  bounties: BountyView[];
  bids: BidView[];
  escrows: EscrowView[];
  deliveries: DeliveryView[];
  verdicts: VerdictView[];
  receipts: ReceiptView[];
  ledger: LedgerView[];
  agents: AgentView[];
  stats: MarketStats;
  budget: BudgetView;
  serverTime: string;
}

export interface BountyGraph {
  bounty: BountyView;
  bids: BidView[];
  escrow: EscrowView | null;
  delivery: DeliveryView | null;
  verdict: VerdictView | null;
  receipt: ReceiptView | null;
  agents: Pick<AgentView, "id" | "name" | "specialty" | "reputation" | "wins" | "losses">[];
}

export interface RoundResult {
  result: {
    bountiesProcessed: number;
    settlements: number;
    refunds: number;
    errors: string[];
  };
  snapshot: BountyGraph | null;
}

export class EngineError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

/**
 * Deployment contract for engineFetch (ENGINE_URL / ENGINE_TOKEN):
 * - Loopback (default http://localhost:8787) is the trusted same-host case:
 *   ENGINE_TOKEN may be omitted and traffic never leaves this machine.
 * - A non-loopback ENGINE_HOST on the engine side requires ENGINE_TOKEN, and
 *   the engine refuses to start without it; this client then sends it as a
 *   Bearer token (server-side only, never NEXT_PUBLIC_).
 * - Any future cross-host support must add TLS or authenticated IPC; until
 *   then the loopback default + token behavior above is the whole contract.
 */
async function engineFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ENGINE_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        ...(ENGINE_TOKEN ? { Authorization: `Bearer ${ENGINE_TOKEN}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new EngineError(
      503,
      `Engine unreachable at ${ENGINE_URL}. Start it with: cd engine && npm run serve`,
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      if (!res.ok) {
        throw new EngineError(res.status, `Engine error ${res.status}`);
      }
      throw new EngineError(502, "Invalid engine response: expected JSON");
    }
  }
  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? `Engine error ${res.status}`;
    throw new EngineError(res.status, message);
  }
  return data as T;
}

/** Fetch the full market snapshot from the engine. */
export async function readMarket(): Promise<Market> {
  return engineFetch<Market>("/market");
}

/** Fetch the market snapshot, returning null offline. */
export async function readMarketSafe(): Promise<Market | null> {
  try {
    return await readMarket();
  } catch {
    return null;
  }
}

/** Validate and post a new bounty task. */
export async function postTask(input: { goal: string; budget: number }): Promise<{ bountyId: string }> {
  const goal = input.goal.trim();
  const budget = Math.round(input.budget);
  if (goal.length < 20 || goal.length > 500) {
    throw new EngineError(400, "Goal must be between 20 and 500 characters.");
  }
  if (!Number.isFinite(budget) || budget <= 0) {
    throw new EngineError(400, "Budget must be a positive number.");
  }
  return engineFetch<{ bountyId: string }>("/task", {
    method: "POST",
    body: JSON.stringify({ goal, budget }),
  });
}

/** Advance one bounty phase via the engine. */
export async function advanceMarket(bountyId: string): Promise<RoundResult> {
  return engineFetch<RoundResult>("/round", {
    method: "POST",
    body: JSON.stringify({ bountyId }),
  });
}

/** Reset the engine economy via the bridge. */
export async function resetMarket(): Promise<void> {
  await engineFetch("/reset", { method: "POST", body: JSON.stringify({ reseed: true }) });
}

/** Toggle engine auto-run and auto-market flags. */
export async function setAutoMarket(opts: { run?: boolean; market?: boolean }): Promise<{ auto: { run: boolean; market: boolean } }> {
  return engineFetch<{ auto: { run: boolean; market: boolean } }>("/auto", {
    method: "POST",
    body: JSON.stringify(opts),
  });
}

/** Safely parse a JSON string if shaped as JSON. */
function tryParseJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
}

/** Render a value for artifact display. */
function renderValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    return parsed !== undefined ? JSON.stringify(parsed, null, 2) : value;
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/** Render a delivery artifact into display text. */
export function artifactText(artifact: unknown): string {
  if (artifact == null) return "";
  if (typeof artifact === "string") return artifact;
  if (typeof artifact === "object") {
    const record = artifact as Record<string, unknown>;
    // Rich envelope persisted by the engine: { deliverable, summary, scores, reason, ... }
    if ("deliverable" in record || "scores" in record) {
      const parts: string[] = [];
      if (typeof record.summary === "string" && record.summary.trim()) {
        parts.push(`SUMMARY\n${record.summary.trim()}`);
      }
      parts.push(`DELIVERABLE\n${renderValue(record.deliverable)}`);
      if (record.scores != null) {
        parts.push(`SCORES\n${JSON.stringify(record.scores, null, 2)}`);
      }
      if (typeof record.reason === "string" && record.reason.trim()) {
        parts.push(`REASON\n${record.reason.trim()}`);
      }
      return parts.join("\n\n");
    }
    // Legacy shapes: unwrap result/text/content/output (recursively for JSON strings).
    for (const key of ["result", "text", "content", "output"]) {
      if (key in record) {
        const rendered = renderValue(record[key]);
        if (rendered !== "—") return rendered;
      }
    }
    return JSON.stringify(artifact, null, 2);
  }
  return String(artifact);
}
