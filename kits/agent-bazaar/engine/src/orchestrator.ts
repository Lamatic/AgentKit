import { supabase } from "./supabase.js";
import { LedgerAdapter, appendLedger } from "./settlement/ledger-adapter.js";
import { X402Adapter } from "./settlement/x402-adapter.js";
import type { SettlementAdapter } from "./settlement/types.js";
import { idempotencyKey, checkIdempotencyAsync } from "./idempotency.js";
import { canSpend, recordSpend, tryReserve, release, getMode } from "./budget-governor.js";
import * as flows from "./flows-client.js";
import { transition } from "./state-machine.js";
import type { BountyStatus, QAVerdict } from "./state-machine.js";
import { ROSTER } from "./agents/roster.js";
import { loadLatestRecording, recordOutputs } from "./replay-store.js";
import type { RecordedFlowOutput } from "./replay-store.js";

const ESCROW_TIMEOUT_MS = 3600_000;

// Max consecutive phases one bounty may advance inside a single round, and the
// pause between chained phases so each stays visible on the dashboard.
const MAX_CHAIN_STEPS = Number(process.env.ENGINE_MAX_CHAIN || "6");
const CHAIN_DWELL_MS = Number(process.env.ENGINE_CHAIN_DWELL_MS || "1500");

/** sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const adapter: SettlementAdapter = process.env.X402_PRIVATE_KEY
  ? new X402Adapter()
  : new LedgerAdapter();

const involvedStates = new Set(["open", "awarded", "in_escrow", "delivered", "qa_pass", "qa_fail"]);

interface RoundResult {
  bountiesProcessed: number;
  settlements: number;
  refunds: number;
  errors: string[];
}

interface RoundContext {
  mode: "live" | "replay";
  roundId: string;
  replayQueue: RecordedFlowOutput[];
  flowOutputs: RecordedFlowOutput[];
  settlements: number;
  refunds: number;
}

type FlowName =
  | "post-bounty"
  | "generate-bid"
  | "execute-task"
  | "qa-judge"
  | "update-reputation";

interface RunOptions {
  mode?: "live" | "replay";
  roundId?: string;
  record?: boolean;
  /** Process a single bounty instead of the whole market (interactive mode). */
  bountyId?: string;
}

/** Advance all active bounties by one orchestration round. */
export async function runRound(opts: RunOptions = {}): Promise<RoundResult> {
  const result: RoundResult = { bountiesProcessed: 0, settlements: 0, refunds: 0, errors: [] };
  const mode = opts.mode ?? getMode();
  const roundId = opts.roundId ?? `round-${Date.now()}`;

  const ctx: RoundContext = {
    mode,
    roundId,
    replayQueue: mode === "replay" ? (await loadLatestRecording()) ?? [] : [],
    flowOutputs: [],
    settlements: 0,
    refunds: 0,
  };

  let query = supabase.from("bounties").select("*");
  if (opts.bountyId) query = query.eq("id", opts.bountyId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch bounties: ${error.message}`);

  const targets = (data ?? [])
    .map((bounty) => ({ bounty, state: parseStatus(bounty.status) }))
    .filter(
      (t): t is { bounty: Record<string, unknown>; state: BountyStatus } =>
        !!t.state && involvedStates.has(t.state.status),
    );

  if (targets.length > 0 && mode === "replay" && !canSpend(1)) {
    console.log(
      `[budget] daily budget exhausted — ${targets.length} bounties advancing on fallbacks`,
    );
  }

  // A bounty advances at most one phase per processBounty call, so without
  // chaining a full lifecycle costs one round per phase (each round lasts as
  // long as its slowest LLM call). Instead chain consecutive phases inside one
  // round: re-read the row, and while it kept moving, process again — with a
  // short dwell so every phase stays visible on the dashboard via Realtime.
  /** processOne helper. */
  async function processOne(target: {
    bounty: Record<string, unknown>;
    state: BountyStatus;
  }): Promise<void> {
    let bounty = target.bounty;
    let state = target.state;
    let processed = false;
    try {
      for (let step = 0; step < MAX_CHAIN_STEPS; step++) {
        const before = JSON.stringify(bounty.status);
        await processBounty(bounty, state, ctx);
        processed = true;
        const { data: fresh } = await supabase
          .from("bounties")
          .select("*")
          .eq("id", bounty.id as string)
          .maybeSingle();
        if (!fresh) break;
        const next = parseStatus(fresh.status);
        if (!next || !involvedStates.has(next.status)) break;
        if (JSON.stringify(fresh.status) === before) break;
        bounty = fresh as Record<string, unknown>;
        state = next;
        await sleep(CHAIN_DWELL_MS);
      }
    } catch (err) {
      result.errors.push(`Bounty ${target.bounty.id}: ${(err as Error).message}`);
    }
    if (processed) result.bountiesProcessed++;
  }

  if (mode === "replay") {
    // Sequential in replay mode so replayQueue.splice stays deterministic.
    for (const target of targets) {
      await processOne(target);
    }
  } else {
    // Independent rows — advance all live bounties side by side.
    await Promise.allSettled(targets.map((target) => processOne(target)));
  }

  result.settlements = ctx.settlements;
  result.refunds = ctx.refunds;

  if (mode === "live" && opts.record !== false && ctx.flowOutputs.length > 0) {
    await recordOutputs(roundId, ctx.flowOutputs);
  }

  return result;
}

/** Parse a stored bounty status value into a typed state. */
export function parseStatus(raw: unknown): BountyStatus | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as BountyStatus;
    } catch {
      return null;
    }
  }
  return raw as BountyStatus;
}

/** processBounty helper. */
async function processBounty(
  bounty: Record<string, unknown>,
  state: BountyStatus,
  ctx: RoundContext,
): Promise<void> {
  switch (state.status) {
    case "open":
      await resumeOpen(bounty, state, ctx);
      break;
    case "awarded":
      await resumeAwarded(bounty, ctx);
      break;
    case "in_escrow":
      await resumeInEscrow(bounty, state, ctx);
      break;
    case "delivered":
      await resumeDelivered(bounty, state, ctx);
      break;
    case "qa_fail":
      await resumeQaFail(bounty, state, ctx);
      break;
    case "qa_pass":
      await resumeQaPass(bounty, state, ctx);
      break;
  }
}

/** resumeOpen helper. */
async function resumeOpen(
  bounty: Record<string, unknown>,
  state: Extract<BountyStatus, { status: "open" }>,
  ctx: RoundContext,
): Promise<void> {
  const bountyId = bounty.id as string;

  if (state.closeAt < Date.now()) {
    const { data: existingBids } = await supabase
      .from("bids")
      .select("id")
      .eq("bounty_id", bountyId);
    if (!existingBids || existingBids.length === 0) {
      const expired = transition(state, "expire", {});
      await writeStatus(bountyId, expired);
      return;
    }
  }

  // Check if bids already exist before generating (two-tick split: tick 1 inserts,
  // tick 2 sees existing bids and proceeds to award). This makes the bidding phase
  // visible on the dashboard for at least one tick.
  const { data: priorBids } = await supabase
    .from("bids")
    .select("id")
    .eq("bounty_id", bountyId);
  const hadBids = priorBids && priorBids.length > 0;

  const bids = await ensureBids(bounty, ctx);
  if (bids.length === 0) return;

  // If we just inserted bids this tick (none existed before), return early so the
  // dashboard can show the bidding phase before we proceed to award.
  if (!hadBids) return;

  await awardAndDeliver(bounty, state, bids, ctx, false);
}

/** resumeAwarded helper. */
async function resumeAwarded(
  bounty: Record<string, unknown>,
  ctx: RoundContext,
): Promise<void> {
  const bountyId = bounty.id as string;
  const { data: existingBids } = await supabase
    .from("bids")
    .select("*")
    .eq("bounty_id", bountyId);
  const bids = (existingBids ?? []) as Record<string, unknown>[];
  if (bids.length > 0) {
    const awarded: BountyStatus = { status: "awarded", bidId: "" };
    await awardAndDeliver(bounty, awarded, bids, ctx, true);
  }
}

/** resumeInEscrow helper. */
async function resumeInEscrow(
  bounty: Record<string, unknown>,
  state: Extract<BountyStatus, { status: "in_escrow" }>,
  ctx: RoundContext,
): Promise<void> {
  const bountyId = bounty.id as string;
  const poster = bounty.posted_by as string;

  // Escrow + latest delivery are independent — fetch together.
  const [escrowRes, deliveryRes] = await Promise.all([
    supabase.from("escrows").select("*").eq("id", state.escrowId).maybeSingle(),
    supabase
      .from("deliveries")
      .select("*")
      .eq("bounty_id", bountyId)
      .order("attempt", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const { data: escrow } = escrowRes;
  const { data: prefetchedDelivery } = deliveryRes;

  if (!escrow) {
    await resumeAwarded(bounty, ctx);
    return;
  }

  if (escrow.status === "refunded") {
    const refunded = transition(state, "refund", { reason: "refunded" });
    await writeStatus(bountyId, refunded);
    return;
  }

  if (escrow.status === "settled") {
    throw new Error(`Unrecoverable state: escrow ${state.escrowId} settled before delivery`);
  }

  if (Date.now() - new Date(escrow.created_at).getTime() > ESCROW_TIMEOUT_MS) {
    const key = idempotencyKey(bountyId, "refund", 1);
    if (canSpend(1) && (await checkIdempotencyAsync(key))) {
      await adapter.refund(state.escrowId, poster);
      recordSpend(1);
      ctx.refunds++;
    }
    const refunded = transition(state, "refund", { reason: "escrow_timeout" });
    await writeStatus(bountyId, refunded);
    return;
  }

  const delivery = prefetchedDelivery;

  if (delivery) {
    const delivered = transition(state, "deliver", {
      deliveryId: delivery.id,
      attempt: delivery.attempt,
    });
    await writeStatus(bountyId, delivered);
    return;
  }

  const { data: existingBids } = await supabase
    .from("bids")
    .select("*")
    .eq("bounty_id", bountyId);
  const bids = (existingBids ?? []) as Record<string, unknown>[];
  if (bids.length === 0) return;

  await awardAndDeliver(bounty, state, bids, ctx, true, {
    escrowId: state.escrowId,
    lockRef: state.lockRef,
  });
}

/** resumeDelivered helper. */
async function resumeDelivered(
  bounty: Record<string, unknown>,
  state: Extract<BountyStatus, { status: "delivered" }>,
  ctx: RoundContext,
): Promise<void> {
  const bountyId = bounty.id as string;
  const attempt = state.attempt;

  const { data: delivery } = await supabase
    .from("deliveries")
    .select("*")
    .eq("bounty_id", bountyId)
    .eq("attempt", attempt)
    .maybeSingle();

  const verdict = await callQaJudge(bounty, delivery, attempt, ctx);
  if (!verdict) return;

  if (delivery) {
    await supabase.from("qa_verdicts").insert({
      id: crypto.randomUUID(),
      bounty_id: bountyId,
      delivery_id: delivery.id,
      score: verdict.score,
      verdict: verdict.verdict,
      rationale: verdict.rationale,
      rubric_hash: verdict.rubric_hash,
    });
  }

  if (verdict.verdict === "pass") {
    const passed = transition(state, "qa_pass", { verdict });
    await writeStatus(bountyId, passed);
  } else {
    const failed = transition(state, "qa_fail", { verdict, revisionOf: attempt });
    await writeStatus(bountyId, failed);
  }
}

/** resumeQaFail helper. */
async function resumeQaFail(
  bounty: Record<string, unknown>,
  state: Extract<BountyStatus, { status: "qa_fail" }>,
  ctx: RoundContext,
): Promise<void> {
  const bountyId = bounty.id as string;
  const revisionOf = state.revisionOf;

  if (revisionOf >= 3) {
    await refundAndFinish(bounty, state, "max_attempts_exceeded", ctx);
    return;
  }

  const nextAttempt = revisionOf + 1;
  const { data: existing } = await supabase
    .from("deliveries")
    .select("id")
    .eq("bounty_id", bountyId)
    .eq("attempt", nextAttempt)
    .maybeSingle();

  let deliveryId = existing?.id as string | undefined;
  if (!deliveryId) {
    const { data: last } = await supabase
      .from("deliveries")
      .select("artifact")
      .eq("bounty_id", bountyId)
      .eq("attempt", revisionOf)
      .maybeSingle();

    deliveryId = crypto.randomUUID();
    const { error } = await supabase.from("deliveries").insert({
      id: deliveryId,
      bounty_id: bountyId,
      attempt: nextAttempt,
      artifact: { revision: nextAttempt, previous: last?.artifact ?? null },
      summary: `Revision ${nextAttempt}`,
    });
    if (error) throw new Error(`Delivery insert failed: ${error.message}`);
  }

  const revised = transition(state, "revise", { deliveryId });
  await writeStatus(bountyId, revised);
}

/** resumeQaPass helper. */
async function resumeQaPass(
  bounty: Record<string, unknown>,
  state: Extract<BountyStatus, { status: "qa_pass" }>,
  ctx: RoundContext,
): Promise<void> {
  const bountyId = bounty.id as string;

  const { data: escrow } = await supabase
    .from("escrows")
    .select("*")
    .eq("bounty_id", bountyId)
    .maybeSingle();

  if (!escrow) throw new Error(`No escrow found for bounty ${bountyId}`);

  const [attempt, workerId] = await Promise.all([
    latestDeliveryAttempt(bountyId),
    escrowWorkerId(escrow.id),
  ]);

  if (escrow.status === "settled") {
    const { data: receipt } = await supabase
      .from("settlement_receipts")
      .select("*")
      .eq("escrow_id", escrow.id)
      .maybeSingle();
    if (receipt) {
      const settled = transition(state, "settle", { receiptId: receipt.id });
      await writeStatus(bountyId, settled);
    }
    return;
  }

  if (escrow.status === "refunded") {
    throw new Error(`Escrow ${escrow.id} already refunded while bounty is qa_pass`);
  }

  const key = idempotencyKey(bountyId, "settle", attempt);
  if (!(await checkIdempotencyAsync(key))) return;

  const receipt = await adapter.settle(escrow.id, workerId);
  recordSpend(1);

  const settled = transition(state, "settle", { receiptId: receipt.receiptId });
  await writeStatus(bountyId, settled);

  ctx.settlements++;
  // Reputation updates in the background — settle status is already written.
  void applyReputation(workerId, "pass").catch((err) =>
    console.error(`[reputation] background update failed for ${workerId}: ${(err as Error).message}`),
  );
}

/** refundAndFinish helper. */
async function refundAndFinish(
  bounty: Record<string, unknown>,
  state: Extract<BountyStatus, { status: "qa_fail" }>,
  reason: string,
  ctx: RoundContext,
): Promise<void> {
  const bountyId = bounty.id as string;
  const poster = bounty.posted_by as string;

  const { data: escrow } = await supabase
    .from("escrows")
    .select("*")
    .eq("bounty_id", bountyId)
    .maybeSingle();

  if (escrow && escrow.status !== "refunded") {
    const workerId = await escrowWorkerId(escrow.id);
    const key = idempotencyKey(bountyId, "refund", state.revisionOf);
    if (canSpend(1) && (await checkIdempotencyAsync(key))) {
      await adapter.refund(escrow.id, poster);
      recordSpend(1);
      ctx.refunds++;
      void applyReputation(workerId, "fail").catch((err) =>
        console.error(`[reputation] background update failed for ${workerId}: ${(err as Error).message}`),
      );
    }
  }

  const refunded = transition(state, "refund", { reason });
  await writeStatus(bountyId, refunded);
}

/** Ensure worker bids exist for a bounty. */
async function ensureBids(
  bounty: Record<string, unknown>,
  ctx: RoundContext,
): Promise<Record<string, unknown>[]> {
  const bountyId = bounty.id as string;
  const poster = bounty.posted_by as string;

  const { data: existingBids } = await supabase
    .from("bids")
    .select("*")
    .eq("bounty_id", bountyId);

  if (existingBids && existingBids.length > 0) return existingBids;

  const budget = Number(bounty.budget);
  const workers = ROSTER.filter((w) => w.id !== poster);

  // All bids generate in parallel (small stagger to avoid 429 bursts) and each
  // bid is inserted the moment its own LLM call returns, so bids stream onto
  // the board one by one instead of waiting for the slowest worker.
  /** bidOne helper. */
  async function bidOne(
    worker: (typeof workers)[number],
    index: number,
  ): Promise<{ bid?: Record<string, unknown>; error?: string }> {
    await sleep(index * 150);
    const bidInput = {
      bounty,
      agentProfile: {
        id: worker.id,
        name: worker.name,
        specialty: worker.specialty,
        reputation: worker.reputation,
        balance: worker.balance,
      },
      openBids: { bids: [] as Record<string, unknown>[] },
    };

    // Reserve up front (atomic check+increment); the fallback path below still
    // counts as consumed, matching the previous finally-recordSpend accounting.
    tryReserve(1);
    let bidResult: Record<string, unknown>;
    try {
      bidResult = await pipe("generate-bid", bidInput, () =>
        flows.generateBid(bidInput) as unknown as Promise<Record<string, unknown>>, ctx);
    } catch (err) {
      console.error(
        `[ensureBids] generate-bid failed for ${worker.name} on bounty ${bountyId}: ${(err as Error).message}. Falling back.`,
      );
      bidResult = { price: null, eta_hours: null, pitch: null };
    }

    let price = Number(bidResult.price as unknown);
    const floor = Math.max(1, Math.round(budget * 0.1) + 1);
    if (!Number.isFinite(price) || price <= 0) {
      price = Math.round(budget * (0.5 + (1 - worker.reputation) * 0.4));
    }
    price = Math.round(Math.max(floor, Math.min(price, Math.max(floor, budget))));

    const bid = {
      id: crypto.randomUUID(),
      bounty_id: bountyId,
      agent_id: worker.id,
      price,
      eta_hours: Math.max(
        1,
        Math.round(Number(bidResult.eta_hours) || 2 + (1 - worker.reputation) * 6),
      ),
      pitch: String(bidResult.pitch || `I can handle this with my ${worker.specialty} capability.`),
      capability: `capabilities/${worker.specialty}.md`,
      reputation: worker.reputation,
      balance: worker.balance,
    };

    try {
      const { reputation: _rep, balance: _bal, ...bidRow } = bid;
      const { error } = await supabase.from("bids").insert(bidRow);
      if (error) return { error: `Bid insert failed: ${error.message}` };
    } catch (err) {
      return { error: `Bid insert failed: ${(err as Error).message}` };
    }
    return { bid };
  }

  const outcomes = await Promise.all(workers.map((worker, i) => bidOne(worker, i)));
  const inMemory: Record<string, unknown>[] = [];
  for (const outcome of outcomes) {
    if (outcome.bid) inMemory.push(outcome.bid);
    else throw new Error(outcome.error ?? "Bid failed");
  }

  return inMemory;
}

/** Hydrate bids with live reputation and balances. */
async function hydrateBids(bids: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  if (bids.length === 0) return bids;

  const agentIds = [...new Set((bids as Array<{ agent_id: string }>).map((b) => b.agent_id))];

  const [agentsRes, ...balanceResults] = await Promise.all([
    supabase.from("agents").select("id, reputation").in("id", agentIds),
    ...agentIds.map((agentId) =>
      supabase
        .from("credit_ledger")
        .select("balance_after")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
  ]);
  const { data: agents } = agentsRes;

  const balances = new Map<string, number>();
  for (let i = 0; i < agentIds.length; i++) {
    const entry = balanceResults[i]?.data;
    if (entry) balances.set(agentIds[i], Number(entry.balance_after));
  }

  const agentRep = new Map((agents ?? []).map((a) => [a.id, Number(a.reputation) || 0.5]));

  return bids.map((b) => {
    const agentId = b.agent_id as string;
    return {
      ...b,
      balance: balances.has(agentId) ? (balances.get(agentId) as number) : 10000,
      reputation: agentRep.has(agentId) ? (agentRep.get(agentId) as number) : 0.5,
    };
  });
}

/** Award a winner, lock escrow, and deliver. */
async function awardAndDeliver(
  bounty: Record<string, unknown>,
  current: BountyStatus,
  bids: Record<string, unknown>[],
  ctx: RoundContext,
  skipAward: boolean,
  existing?: { escrowId: string; lockRef: string },
): Promise<void> {
  const bountyId = bounty.id as string;
  const poster = bounty.posted_by as string;

  const hydrated = await hydrateBids(bids);

  if (!tryReserve(1)) {
    // Degraded mode: budget exhausted. Never stall — fall through and run on
    // replay/fallback outputs so the pipeline keeps settling.
    console.log(`[budget] exhausted — bounty ${bountyId} proceeding on fallbacks`);
  }

  const taskInput = {
    bounty,
    bids: { bids: hydrated },
    capability: String(hydrated[0]?.capability || "capabilities/general.md"),
  };

  // Reservation above already counted this attempt; release only if the attempt
  // throws before consuming budget.
  let result: Record<string, unknown>;
  try {
    result = await pipe("execute-task", taskInput, () => flows.executeTask(taskInput) as unknown as Promise<Record<string, unknown>>, ctx);
  } catch (err) {
    release(1);
    throw err;
  }

  const winner = resolveWinner(hydrated, result.winnerBidId as unknown);
  const rawEscrowId = existing?.escrowId || (result.escrowId as string) || crypto.randomUUID();
  const escrowId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawEscrowId)
    ? rawEscrowId
    : crypto.randomUUID();
  const amountRaw = Number(result.amount);
  const winnerPrice = Math.round(Number(winner.price));
  const proposal = Number.isFinite(amountRaw) && amountRaw > 0
    ? Math.round(amountRaw)
    : winnerPrice;
  const budgetCap = Math.round(Number(bounty.budget));
  const amount = Number.isFinite(budgetCap) && budgetCap > 0
    ? Math.min(proposal, budgetCap)
    : proposal;
  const lockRef = existing?.lockRef || (result.lockRef as string) || `lock-${escrowId}`;

  const { data: existingEscrow } = await supabase
    .from("escrows")
    .select("id")
    .eq("id", escrowId)
    .maybeSingle();

  if (!existingEscrow) {
    const { error } = await supabase.from("escrows").insert({
      id: escrowId,
      bounty_id: bountyId,
      bid_id: winner.id,
      amount,
      lock_ref: lockRef,
      status: "locked",
    });
    if (error) throw new Error(`Escrow insert failed: ${error.message}`);

    const lock = await adapter.lock(escrowId, BigInt(amount), { bountyId, bidId: winner.id as string });
    recordSpend(1);

    if (adapter instanceof LedgerAdapter) {
      await appendLedger(poster, -amount, "bid_lock", bountyId);
    }

    void lock;
  }

  let next: BountyStatus = current;
  if (!skipAward && current.status === "open") {
    next = transition(next, "award", { bidId: winner.id });
    await writeStatus(bountyId, next);
  }

  if (current.status === "open" || current.status === "awarded") {
    next = transition(next, "lock_escrow", { escrowId, lockRef });
    await writeStatus(bountyId, next);
  }

  const deliveryId = crypto.randomUUID();
  // Persist the FULL execute-task output as an envelope so the dashboard can
  // show the complete deliverable. Previously only `result.artifact` was kept
  // and summary/scores/reason were silently discarded.
  const artifact = {
    deliverable: normalizeDeliverable(result.artifact, bounty.goal),
    summary: String(result.summary || ""),
    scores: (result.scores as Record<string, unknown> | null) ?? null,
    reason: String(result.reason || ""),
    winnerBidId: winner.id,
    producedAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("deliveries").insert({
    id: deliveryId,
    bounty_id: bountyId,
    attempt: 1,
    artifact,
    summary: String(result.summary || "Delivered artifact"),
  });
  if (error) throw new Error(`Delivery insert failed: ${error.message}`);

  const delivered = transition(next, "deliver", { deliveryId, attempt: 1 });
  await writeStatus(bountyId, delivered);
}

/** Normalize an LLM artifact into an object. */
function normalizeDeliverable(raw: unknown, goal: unknown): Record<string, unknown> {
  if (raw !== null && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (parsed !== null && typeof parsed === "object") {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // Not JSON — fall through to text wrapper.
      }
    }
    return { text: raw };
  }
  return { note: `No artifact returned for: ${String(goal ?? "")}` };
}

/** Resolve the winning bid from LLM or fallback scoring. */
function resolveWinner(
  bids: Record<string, unknown>[],
  winnerBidId: unknown,
): Record<string, unknown> {
  const found = bids.find((b) => b.id === winnerBidId);
  if (found) return found;

  return bids.reduce(
    (best: Record<string, unknown>, bid: Record<string, unknown>) => {
      const score =
        (Number(bid.reputation as unknown) || 0.5) * 0.6 +
        (1 - (Number(bid.price as unknown) || 1) / 1000) * 0.4;
      const bestScore =
        (Number(best.reputation as unknown) || 0.5) * 0.6 +
        (1 - (Number(best.price as unknown) || 1) / 1000) * 0.4;
      return score > bestScore ? { ...bid, score } : best;
    },
    { ...(bids[0] ?? {}), score: -1 },
  );
}

/** Run QA judgment for a delivery attempt. */
async function callQaJudge(
  bounty: Record<string, unknown>,
  delivery: Record<string, unknown> | null,
  attempt: number,
  ctx: RoundContext,
): Promise<QAVerdict | null> {
  const bountyId = bounty.id as string;

  const { data: escrow } = await supabase
    .from("escrows")
    .select("*")
    .eq("bounty_id", bountyId)
    .maybeSingle();

  // No canSpend gate here: when the budget is exhausted the QA flow resolves
  // via replay/fallback instead of stalling the bounty forever.
  if (!escrow) return null;

  const rubric = (bounty.rubric as Record<string, unknown>) || {
    criteria: [
      { name: "Completeness", weight: 0.4, description: "Covers all requirements" },
      { name: "Accuracy", weight: 0.3, description: "Factually correct" },
      { name: "Quality", weight: 0.3, description: "Meets professional standards" },
    ],
    maxScore: 1.0,
  };

  const artifact =
    delivery?.artifact == null
      ? ""
      : typeof delivery.artifact === "string"
        ? delivery.artifact
        : JSON.stringify(delivery.artifact);

  const qaInput = {
    bounty,
    rubric,
    artifact,
    attempt,
    escrow: {
      escrowId: escrow.id,
      amount: escrow.amount,
      bid_id: escrow.bid_id,
      agent_id: escrow.bid_id,
    },
  };

  tryReserve(1);
  let result: Record<string, unknown>;
  try {
    result = await pipe("qa-judge", qaInput, () => flows.qaJudge(qaInput) as unknown as Promise<Record<string, unknown>>, ctx);
  } catch (err) {
    release(1);
    throw err;
  }

  const parsedScore = Number(result.score);
  const score = Number.isFinite(parsedScore) ? Math.max(0, Math.min(1, parsedScore)) : 0.75;
  // Fail closed: only an explicit "pass" settles; anything unexpected retries.
  const verdict: "pass" | "fail" = String(result.verdict) === "pass" ? "pass" : "fail";

  return {
    score,
    verdict,
    rationale: String(result.rationale || "No rationale provided."),
    rubric_hash: sha1ish(JSON.stringify(rubric)),
  };
}

/** Apply pass/fail reputation updates. */
async function applyReputation(agentId: string, outcome: "pass" | "fail"): Promise<void> {
  const delta = outcome === "pass" ? 0.05 : -0.1;

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .maybeSingle();

  if (!agent) return;

  const current = Number(agent.reputation) || 0.5;
  await flows.updateReputation({ agentId, outcome, currentReputation: current } as unknown as { agentId: string; outcome: "pass" | "fail" });
  recordSpend(1);

  const updated = Math.max(0, Math.min(1, current + delta));
  const reputation = Math.round(updated * 100) / 100;

  await supabase
    .from("agents")
    .update({
      reputation,
      wins: outcome === "pass" ? Number(agent.wins) + 1 : Number(agent.wins),
      losses: outcome === "fail" ? Number(agent.losses) + 1 : Number(agent.losses),
    })
    .eq("id", agentId);
}

/** Persist a bounty status transition. */
async function writeStatus(bountyId: string, next: BountyStatus): Promise<void> {
  const { error } = await supabase
    .from("bounties")
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq("id", bountyId);
  if (error) throw new Error(`Status write failed: ${error.message}`);
}

/** Run a flow live or from replay recordings. */
async function pipe(
  name: FlowName,
  input: Record<string, unknown>,
  live: () => Promise<Record<string, unknown>>,
  ctx: RoundContext,
): Promise<Record<string, unknown>> {
  if (ctx.mode === "replay") {
    // Only reuse a recording cut for THIS bounty — otherwise a stale artifact
    // from an old task would masquerade as the current task's deliverable.
    // No match → {} so downstream fallbacks produce honest generic content.
    const bountyId = (input.bounty as Record<string, unknown> | undefined)?.id as
      | string
      | undefined;
    const idx = ctx.replayQueue.findIndex((r) => {
      if (r.flowId !== name) return false;
      if (!bountyId) return true;
      const recBounty = (r.input as Record<string, unknown> | undefined)?.bounty as
        | Record<string, unknown>
        | undefined;
      return recBounty?.id === bountyId;
    });
    if (idx >= 0) {
      const [rec] = ctx.replayQueue.splice(idx, 1);
      return rec.output as Record<string, unknown>;
    }
    return {};
  }

  const output = await live();
  ctx.flowOutputs.push({
    flowId: name,
    input,
    output,
    recordedAt: new Date().toISOString(),
    roundId: ctx.roundId,
  });
  return output;
}

/** Fetch the latest delivery attempt number. */
async function latestDeliveryAttempt(bountyId: string): Promise<number> {
  const { data } = await supabase
    .from("deliveries")
    .select("attempt")
    .eq("bounty_id", bountyId)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? Number(data.attempt) : 1;
}

/** Resolve the worker behind an escrow. */
async function escrowWorkerId(escrowId: string): Promise<string> {
  const { data: escrow } = await supabase
    .from("escrows")
    .select("bid_id")
    .eq("id", escrowId)
    .maybeSingle();
  if (!escrow?.bid_id) return "";
  const { data: bid } = await supabase
    .from("bids")
    .select("agent_id")
    .eq("id", escrow.bid_id)
    .maybeSingle();
  return bid?.agent_id || "";
}

/** Compute a short hash for rubric identity. */
function sha1ish(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return `rubric-${Math.abs(hash).toString(16)}`;
}

export { adapter };