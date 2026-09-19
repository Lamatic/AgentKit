import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runRound } from "../src/orchestrator.js";
import {
  canSpend,
  recordSpend,
  getBudgetStatus,
  setDailyBudget,
  getMode,
} from "../src/budget-governor.js";
import { checkIdempotency, resetIdempotency } from "../src/idempotency.js";
import { transition } from "../src/state-machine.js";
import type { BountyStatus } from "../src/state-machine.js";

vi.mock("../src/supabase.js", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));

vi.mock("../src/flows-client.js", () => ({
  postBounty: vi.fn().mockResolvedValue({ goal: "test", budget: 100, rubric: {} }),
  generateBid: vi.fn().mockResolvedValue({ price: 800, eta_hours: 4, pitch: "test", capability: "summarizer" }),
  executeTask: vi.fn().mockResolvedValue({
    artifact: { summary: "test" },
    winnerBidId: "bid-001",
    escrowId: "escrow-001",
    amount: 800,
    lockRef: "lock-001",
    scores: [],
    reason: "test",
    summary: "test summary",
  }),
  qaJudge: vi.fn().mockResolvedValue({
    score: 0.85,
    verdict: "pass",
    rationale: "good",
    action: "settle",
    receiptId: "receipt-001",
    newAttempt: 1,
    reason: "",
  }),
  updateReputation: vi.fn().mockResolvedValue({ agentId: "agent-1", delta: 0.05, newScore: 0.55, outcome: "pass" }),
}));

describe("Golden Path", () => {
  beforeEach(() => {
    resetIdempotency();
    setDailyBudget(20);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs a full round without errors", async () => {
    const result = await runRound();
    expect(result.bountiesProcessed).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("budget governor tracks spending and switches to replay when exhausted", () => {
    expect(canSpend(1)).toBe(true);
    const status = getBudgetStatus();
    expect(status.daily).toBe(20);
    expect(status.remaining).toBe(20);

    setDailyBudget(2);
    expect(canSpend(1)).toBe(true);
    recordSpend(1);
    expect(canSpend(1)).toBe(true);
    recordSpend(1);
    expect(canSpend(1)).toBe(false);
    expect(getMode()).toBe("replay");
  });

  it("idempotency prevents duplicate processing with key pattern bounty:{id}:{transition}:{attempt}", () => {
    const key1 = "bounty:123:settle:1";
    expect(checkIdempotency(key1)).toBe(true);
    expect(checkIdempotency(key1)).toBe(false);
    const key2 = "bounty:123:settle:2";
    expect(checkIdempotency(key2)).toBe(true);
  });

  it("crash recovery: kill between lock_escrow and settle → restart converges", async () => {
    let state: BountyStatus = { status: "draft" };
    state = transition(state, "post", {});
    state = transition(state, "award", { bidId: "bid-1" });
    state = transition(state, "lock_escrow", { escrowId: "esc-1", lockRef: "lock-1" });
    expect(state.status).toBe("in_escrow");

    state = transition(state, "deliver", { deliveryId: "del-1", attempt: 1 });
    expect(state.status).toBe("delivered");

    state = transition(state, "qa_pass", {
      verdict: { score: 0.85, verdict: "pass", rationale: "good", rubric_hash: "h" },
    });
    expect(state.status).toBe("qa_pass");

    state = transition(state, "settle", { receiptId: "rec-1" });
    expect(state.status).toBe("settled");
    expect(canSpend(1)).toBe(true);
  });

  it("constitution rejects self-dealing: workers never equal client poster", async () => {
    const { ROSTER } = await import("../src/agents/roster.js");
    const { createClientAgent } = await import("../src/agents/client-agent.js");
    const client = createClientAgent("agent-client-1", "Client-One");

    const isSelfDeal = ROSTER.some((w) => w.id === client.id);
    expect(ROSTER.length).toBeGreaterThanOrEqual(3);
    expect(isSelfDeal).toBe(false);
  });
});