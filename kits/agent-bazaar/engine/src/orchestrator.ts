import { supabase } from "./supabase.js";
import { LedgerAdapter, appendLedger } from "./settlement/ledger-adapter.js";
import { X402Adapter, FacilitatorTimeoutError } from "./settlement/x402-adapter.js";
import type { SettlementAdapter } from "./settlement/types.js";
import { idempotencyKey, checkIdempotencyAsync, releaseIdempotency } from "./idempotency.js";
import { canSpend, recordSpend, tryReserve, release, getMode } from "./budget-governor.js";
import * as flows from "./flows-client.js";
import { transition } from "./state-machine.js";
import type { BountyStatus, QAVerdict } from "./state-machine.js";
import { ROSTER } from "./agents/roster.js";
import { syncWorkerReputation } from "./agents/worker-agent.js";
import { loadLatestRecording, recordOutputs } from "./replay-store.js";
import type { RecordedFlowOutput } from "./replay-store.js";

const ESCROW_TIMEOUT_MS = 3600_000;

// Max consecutive phases one bounty may advance inside a single round, and the
// pause between chained phases so each stays visible on the dashboard.
/** Parse chain-step limit: positive integer, else documented default 6. */
function parseChainSteps(raw: string | undefined): number {
  const n = Number(raw ?? "6");
  return Number.isInteger(n) && n > 0 ? n : 6;
}
/** Parse chain dwell: positive finite ms, else documented default 1500. */
function parseChainDwellMs(raw: string | undefined): number {
  const n = Number(raw ?? "1500");
  return Number.isFinite(n) && n > 0 ? n : 1500;
}
const MAX_CHAIN_STEPS = parseChainSteps(process.env.ENGINE_MAX_CHAIN);
const CHAIN_DWELL_MS = parseChainDwellMs(process.env.ENGINE_CHAIN_DWELL_MS);

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
        const { data: fresh, error: freshError } = await supabase
          .from("bounties")
          .select("*")
          .eq("id", bounty.id as string)
          .maybeSingle();
        if (freshError) throw new Error(`Bounty reload failed for ${bounty.id}: ${freshError.message}`);
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
    const { data: existingBids, error: existingBidsError } = await supabase
      .from("bids")
      .select("id")
      .eq("bounty_id", bountyId);
    if (existingBidsError) throw new Error(`Bids read failed for bounty ${bountyId}: ${existingBidsError.message}`);
    if (!existingBids || existingBids.length === 0) {
      const expired = transition(state, "expire", {});
      await writeStatus(bountyId, expired);
      return;
    }
  }

  // Check if bids already exist before generating (two-tick split: tick 1 inserts,
  // tick 2 sees existing bids and proceeds to award). This makes the bidding phase
  // visible on the dashboard for at least one tick.
  const { data: priorBids, error: priorBidsError } = await supabase
    .from("bids")
    .select("id")
    .eq("bounty_id", bountyId);
  if (priorBidsError) throw new Error(`Bids read failed for bounty ${bountyId}: ${priorBidsError.message}`);
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
  const { data: existingBids, error: existingBidsError } = await supabase
    .from("bids")
    .select("*")
    .eq("bounty_id", bountyId);
  if (existingBidsError) throw new Error(`Bids read failed for bounty ${bountyId}: ${existingBidsError.message}`);
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
  const { data: escrow, error: escrowError } = escrowRes;
  const { data: prefetchedDelivery, error: deliveryError } = deliveryRes;
  if (escrowError) throw new Error(`Escrow read failed for bounty ${bountyId}: ${escrowError.message}`);
  if (deliveryError) throw new Error(`Delivery read failed for bounty ${bountyId}: ${deliveryError.message}`);

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
    // Refunds are never budget-gated: user funds must always be releasable.
    // Mark refunded only after the refund succeeds; a consumed key with the
    // escrow still locked means a prior attempt never finished, so leave the
    // status untouched for reconciliation instead of marking it falsely.
    if (await checkIdempotencyAsync(key)) {
      try {
        await adapter.refund(state.escrowId, poster);
      } catch (err) {
        await releaseIdempotency(key);
        throw err;
      }
      ctx.refunds++;
      const refunded = transition(state, "refund", { reason: "escrow_timeout" });
      await writeStatus(bountyId, refunded);
    }
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

  const { data: existingBids, error: existingBidsError } = await supabase
    .from("bids")
    .select("*")
    .eq("bounty_id", bountyId);
  if (existingBidsError) throw new Error(`Bids read failed for bounty ${bountyId}: ${existingBidsError.message}`);
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

  const { data: delivery, error: deliveryError } = await supabase
    .from("deliveries")
    .select("*")
    .eq("bounty_id", bountyId)
    .eq("attempt", attempt)
    .maybeSingle();
  if (deliveryError) throw new Error(`Delivery read failed for bounty ${bountyId}: ${deliveryError.message}`);

  const verdict = await callQaJudge(bounty, delivery, attempt, ctx);
  if (!verdict) return;

  if (delivery) {
    const { error: qaInsertError } = await supabase.from("qa_verdicts").insert({
      id: crypto.randomUUID(),
      bounty_id: bountyId,
      delivery_id: delivery.id,
      score: verdict.score,
      verdict: verdict.verdict,
      rationale: verdict.rationale,
      rubric_hash: verdict.rubric_hash,
    });
    if (qaInsertError) throw new Error(`QA verdict write failed for bounty ${bountyId}: ${qaInsertError.message}`);
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
  const { data: existing, error: existingError } = await supabase
    .from("deliveries")
    .select("id")
    .eq("bounty_id", bountyId)
    .eq("attempt", nextAttempt)
    .maybeSingle();
  if (existingError) throw new Error(`Delivery read failed for bounty ${bountyId}: ${existingError.message}`);

  let deliveryId = existing?.id as string | undefined;
  if (!deliveryId) {
    const { data: last, error: lastError } = await supabase
      .from("deliveries")
      .select("artifact")
      .eq("bounty_id", bountyId)
      .eq("attempt", revisionOf)
      .maybeSingle();
    if (lastError) throw new Error(`Delivery read failed for bounty ${bountyId}: ${lastError.message}`);

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

  const { data: escrow, error: escrowError } = await supabase
    .from("escrows")
    .select("*")
    .eq("bounty_id", bountyId)
    .maybeSingle();
  if (escrowError) throw new Error(`Escrow read failed for bounty ${bountyId}: ${escrowError.message}`);

  if (!escrow) throw new Error(`No escrow found for bounty ${bountyId}`);

  const [attempt, workerId] = await Promise.all([
    latestDeliveryAttempt(bountyId),
    escrowWorkerId(escrow.id),
  ]);

  if (escrow.status === "settled") {
    const { data: receipt, error: receiptError } = await supabase
      .from("settlement_receipts")
      .select("*")
      .eq("escrow_id", escrow.id)
      .maybeSingle();
    if (receiptError) throw new Error(`Receipt read failed for escrow ${escrow.id}: ${receiptError.message}`);
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

  // Release the key on failure so a later round can retry; the escrow
  // locked -> settled claim still guards against double-processing.
  let receipt;
  try {
    receipt = await adapter.settle(escrow.id, workerId);
  } catch (err) {
    await releaseIdempotency(key);
    throw err;
  }
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

  const { data: escrow, error: escrowError } = await supabase
    .from("escrows")
    .select("*")
    .eq("bounty_id", bountyId)
    .maybeSingle();
  if (escrowError) throw new Error(`Escrow read failed for bounty ${bountyId}: ${escrowError.message}`);

  if (escrow && escrow.status !== "refunded") {
    const workerId = await escrowWorkerId(escrow.id);
    const key = idempotencyKey(bountyId, "refund", state.revisionOf);
    // Refunds are never budget-gated: user funds must always be releasable.
    // Mark refunded only after the refund succeeds; a consumed key with the
    // escrow still locked leaves the status untouched for reconciliation.
    if (await checkIdempotencyAsync(key)) {
      try {
        await adapter.refund(escrow.id, poster);
      } catch (err) {
        await releaseIdempotency(key);
        throw err;
      }
      ctx.refunds++;
      void applyReputation(workerId, "fail").catch((err) =>
        console.error(`[reputation] background update failed for ${workerId}: ${(err as Error).message}`),
      );
      const refunded = transition(state, "refund", { reason });
      await writeStatus(bountyId, refunded);
    }
    return;
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

  const { data: existingBids, error: existingBidsError } = await supabase
    .from("bids")
    .select("*")
    .eq("bounty_id", bountyId);
  if (existingBidsError) throw new Error(`Bids read failed for bounty ${bountyId}: ${existingBidsError.message}`);

  if (existingBids && existingBids.length > 0) return existingBids;

  // Load live reputations before agentProfile/fallback pricing reads them:
  // ROSTER is in-memory (0.5 at boot) while apply_reputation updates the DB.
  // Sync here so bids price off the current recorded value. Hydration for
  // award decisions still happens later in hydrateBids.
  const workerIds = ROSTER.filter((w) => w.id !== poster).map((w) => w.id);
  if (workerIds.length > 0) {
    const { data: liveAgents, error: liveAgentsError } = await supabase
      .from("agents")
      .select("id, reputation")
      .in("id", workerIds);
    if (liveAgentsError) throw new Error(`Agents read failed for bounty ${bountyId}: ${liveAgentsError.message}`);
    const liveById = new Map((liveAgents ?? []).map((a) => [a.id as string, a.reputation]));
    for (const w of ROSTER) {
      if (liveById.has(w.id)) syncWorkerReputation(w, liveById.get(w.id));
    }
  }

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

    // Reserve up front (atomic check+increment). When the budget is exhausted
    // outside replay, skip the provider call: the deterministic derivation
    // below already handles null fields.
    const reserved = await tryReserve(1);
    let bidResult: Record<string, unknown>;
    if (!reserved && ctx.mode !== "replay") {
      bidResult = { price: null, eta_hours: null, pitch: null };
    } else {
      try {
        bidResult = await pipe("generate-bid", bidInput, () =>
          flows.generateBid(bidInput) as unknown as Promise<Record<string, unknown>>, ctx);
      } catch (err) {
        console.error(
          `[ensureBids] generate-bid failed for ${worker.name} on bounty ${bountyId}: ${(err as Error).message}. Falling back.`,
        );
        bidResult = { price: null, eta_hours: null, pitch: null };
      }
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
        .order("seq", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
  ]);
  const { data: agents, error: agentsError } = agentsRes;
  if (agentsError) throw new Error(`Agents read failed: ${agentsError.message}`);

  const balances = new Map<string, number>();
  for (let i = 0; i < agentIds.length; i++) {
    const entry = balanceResults[i]?.data;
    if (entry) balances.set(agentIds[i], Number(entry.balance_after));
  }

  const agentRep = new Map((agents ?? []).map((a) => {
    // A persisted reputation of 0 is valid — fall back to 0.5 only for
    // non-finite values.
    const rep = Number(a.reputation);
    return [a.id, Number.isFinite(rep) ? rep : 0.5];
  }));

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

  const reserved = await tryReserve(1);
  if (!reserved) {
    // Degraded mode: budget exhausted. Never stall — fall through and run on
    // replay/fallback outputs so the pipeline keeps settling.
    console.log(`[budget] exhausted — bounty ${bountyId} proceeding on fallbacks`);
  }

  const taskInput = {
    bounty,
    bids: { bids: hydrated },
    capability: String(hydrated[0]?.capability || "capabilities/general.md"),
  };

  // Release only a reservation this attempt actually holds; a failed
  // reservation consumed nothing, so releasing it would corrupt the count.
  // With no reservation outside replay, run deterministically: empty fields
  // engage the existing fallbacks below (deterministic winner pick,
  // budget-capped price, fresh escrow ids, wrapped artifact).
  let result: Record<string, unknown>;
  if (!reserved && ctx.mode !== "replay") {
    console.log(`[budget] exhausted — bounty ${bountyId} proceeding on deterministic fallback`);
    result = {};
  } else {
    try {
      result = await pipe("execute-task", taskInput, () => flows.executeTask(taskInput) as unknown as Promise<Record<string, unknown>>, ctx);
    } catch (err) {
      if (reserved) await release(1);
      throw err;
    }
  }

  const winner = resolveWinner(hydrated, result.winnerBidId as unknown);
  // Engine-owned escrow identity: never trust result.escrowId from the flow
  // (LLM output). Only the resume path (existing) may reuse an id, and only
  // after the bounty_id check below.
  const rawEscrowId = existing?.escrowId || crypto.randomUUID();
  let escrowId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawEscrowId)
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
  let lockRef = existing?.lockRef || `lock-${escrowId}`;

  const { data: existingEscrow, error: existingEscrowError } = await supabase
    .from("escrows")
    .select("id, bounty_id")
    .eq("id", escrowId)
    .maybeSingle();
  if (existingEscrowError) throw new Error(`Escrow read failed for ${escrowId}: ${existingEscrowError.message}`);
  if (existingEscrow) {
    // A row already claims this id: only reuse it when it belongs to this
    // bounty, otherwise reject — a foreign escrow must never be locked or
    // associated with the current bounty.
    if ((existingEscrow as Record<string, unknown>).bounty_id !== bountyId) {
      throw new Error(`Escrow ${escrowId} belongs to another bounty — refusing to reuse`);
    }
  }

  if (!existingEscrow) {
    const { error } = await supabase.from("escrows").insert({
      id: escrowId,
      bounty_id: bountyId,
      bid_id: winner.id,
      amount,
      lock_ref: lockRef,
      status: "locked",
    });
    if (error) {
      // Uniqueness conflict: a concurrent writer won the race for this
      // bounty — stop this attempt immediately. Do not adopt raced ids or
      // continue with local winner/amount/artifact data; reload and let the
      // next round resume from the winner row.
      if (error.code === "23505") {
        const { data: raced, error: reloadError } = await supabase
          .from("escrows")
          .select("id, lock_ref")
          .eq("bounty_id", bountyId)
          .maybeSingle();
        if (reloadError || !raced) throw new Error(`Escrow insert failed: ${error.message}`);
        const { data: freshBounty, error: bountyReloadError } = await supabase
          .from("bounties")
          .select("*")
          .eq("id", bountyId)
          .maybeSingle();
        if (bountyReloadError) throw new Error(`Escrow race reload failed for bounty ${bountyId}: ${bountyReloadError.message}`);
        void freshBounty;
        void raced;
        return;
      } else {
        throw new Error(`Escrow insert failed: ${error.message}`);
      }
    } else {
      // Treat the insert and lock/debit as one claim: a failed lock or debit
      // must not leave a locked row that suppresses retry. Roll back our own
      // insert, log if the rollback fails, and rethrow the original error.
      // The held reservation already accounts for this execution (the
      // execute-task result was produced), so it is preserved for both
      // timeout and confirmed failures — only a pipe failure before a result
      // releases (see above).
      try {
        const lock = await adapter.lock(escrowId, BigInt(amount), { bountyId, bidId: winner.id as string });

        if (adapter instanceof LedgerAdapter) {
          await appendLedger(poster, String(-amount), "bid_lock", bountyId);
        }

        void lock;
      } catch (err) {
        // A facilitator timeout means the lock may have executed: the escrow
        // row is the claim record, so preserve it for manual reconciliation
        // instead of deleting it. All other failures keep existing cleanup.
        // Reservation is preserved in both cases (see above).
        if (err instanceof FacilitatorTimeoutError) {
          console.error(`[escrow] lock timed out for ${escrowId}: escrow row preserved — manual reconciliation required`);
          throw err;
        }
        const { error: rollbackError } = await supabase.from("escrows").delete().eq("id", escrowId);
        if (rollbackError) {
          console.error(`[escrow] rollback failed for ${escrowId}: ${rollbackError.message} — manual reconciliation required`);
        }
        throw err;
      }
    }
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
  const deliverable = normalizeDeliverable(result.artifact, bounty.goal);
  // The flow's outputMapping assigns the whole serialized worker response to
  // artifact and never maps summary: recover it from the parsed worker JSON
  // so the expected result.summary value survives the boundary.
  const summary = String(
    result.summary || (typeof deliverable.summary === "string" ? deliverable.summary : "") || "",
  );
  const artifact = {
    deliverable,
    summary,
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
    summary: summary || "Delivered artifact",
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

  const { data: escrow, error: escrowError } = await supabase
    .from("escrows")
    .select("*")
    .eq("bounty_id", bountyId)
    .maybeSingle();
  if (escrowError) throw new Error(`Escrow read failed for bounty ${bountyId}: ${escrowError.message}`);

  // No canSpend gate here: when the budget is exhausted the QA flow resolves
  // via replay/fallback instead of stalling the bounty forever.
  if (!escrow) return null;

  const rubric = (bounty.rubric as Record<string, unknown>) || flows.fallbackRubric();

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
      agent_id: await escrowWorkerId(escrow.id),
    },
  };

  const reserved = await tryReserve(1);
  if (!reserved && ctx.mode !== "replay") {
    // Budget exhausted: hold the delivery without consuming a QA attempt.
    return null;
  }
  let result: Record<string, unknown>;
  try {
    result = await pipe("qa-judge", qaInput, () => flows.qaJudge(qaInput) as unknown as Promise<Record<string, unknown>>, ctx);
  } catch (err) {
    if (reserved) await release(1);
    throw err;
  }

  const parsedScore = Number(result.score);
  const score = Number.isFinite(parsedScore) ? Math.max(0, Math.min(1, parsedScore)) : 0.75;
  // Replay miss (empty recording): no judgment exists. Treat as unavailable —
  // release any reservation and hold without resolving a failure or consuming
  // a QA attempt. Live and fallback results always carry verdict or action.
  if (result.verdict == null && result.action == null) {
    if (reserved) await release(1);
    return null;
  }
  // Hold verdict from a degraded breaker: leave the delivery unchanged.
  if (String(result.action) === "hold") {
    if (reserved) await release(1);
    return null;
  }
  // Fail closed: only an explicit "pass" settles; anything unexpected retries.
  // Verdict supremacy with teeth: a pass below the 0.7 threshold cannot settle.
  const verdict: "pass" | "fail" = String(result.verdict) === "pass" && score >= 0.7 ? "pass" : "fail";

  return {
    score,
    verdict,
    rationale: String(result.rationale || "No rationale provided."),
    rubric_hash: typeof result.rubric_hash === "string" && result.rubric_hash.length > 0
      ? String(result.rubric_hash)
      : sha1ish(JSON.stringify(rubric)),
  };
}

/** Apply pass/fail reputation updates. */
async function applyReputation(agentId: string, outcome: "pass" | "fail"): Promise<void> {
  const delta = outcome === "pass" ? 0.05 : -0.1;

  const { data: agent, error: agentReadError } = await supabase
    .from("agents")
    .select("id, reputation")
    .eq("id", agentId)
    .maybeSingle();
  if (agentReadError) throw new Error(`Agent read failed for ${agentId}: ${agentReadError.message}`);

  if (!agent) return;

  // A persisted reputation of 0 is valid — fall back to 0.5 only when the
  // stored value is non-numeric or otherwise invalid. Used for the flow input
  // only; the write below never relies on in-memory values.
  const stored = Number(agent.reputation);
  const current = Number.isFinite(stored) ? stored : 0.5;
  // Reserve budget before the paid flow instead of post-call charging; a held
  // reservation already accounts for this execution. Release on throw.
  // Budget exhaustion skips only the paid flow: the database write below is
  // free, so degraded mode still records the outcome.
  const reserved = await tryReserve(1);
  if (reserved) {
    try {
      await flows.updateReputation({ agentId, outcome, currentReputation: current } as unknown as { agentId: string; outcome: "pass" | "fail" });
    } catch (err) {
      await release(1);
      throw err;
    }
  } else {
    console.log(`[budget] exhausted — recording reputation without paid flow for ${agentId}`);
  }

  // Single atomic write: clamping, two-decimal rounding, and win/loss
  // accounting happen server-side, so concurrent settlements cannot interleave
  // a read-modify-write. NULL means the agent vanished mid-flight.
  const { data: updated, error } = await supabase.rpc("apply_reputation", {
    p_agent_id: agentId,
    p_delta: delta,
    p_win: outcome === "pass",
  });
  if (error) throw new Error(`Reputation update failed: ${error.message}`);
  // Keep the in-memory roster consistent so the next ensureBids prices off
  // the fresh value even before its own live reload. The RPC returns the new
  // reputation as numeric (NULL when the agent vanished). A 0 stays 0.
  const rosterEntry = ROSTER.find((w) => w.id === agentId);
  if (rosterEntry && updated !== null && updated !== undefined) {
    const fresh = Array.isArray(updated)
      ? (updated[0] as Record<string, unknown> | number)
      : updated;
    const rep = typeof fresh === "object" && fresh !== null && "reputation" in (fresh as Record<string, unknown>)
      ? (fresh as Record<string, unknown>).reputation
      : fresh;
    if (rep !== null && rep !== undefined) syncWorkerReputation(rosterEntry, rep);
  }
  void updated;
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
  // Hold verdicts are transient non-judgments, not replayable flow results —
  // recording them would let a later replay return "hold" as history.
  if (!(name === "qa-judge" && (output as Record<string, unknown> | null)?.action === "hold")) {
    ctx.flowOutputs.push({
      flowId: name,
      input,
      output,
      recordedAt: new Date().toISOString(),
      roundId: ctx.roundId,
    });
  }
  return output;
}

/** Fetch the latest delivery attempt number. */
async function latestDeliveryAttempt(bountyId: string): Promise<number> {
  const { data, error } = await supabase
    .from("deliveries")
    .select("attempt")
    .eq("bounty_id", bountyId)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Delivery read failed for bounty ${bountyId}: ${error.message}`);
  return data ? Number(data.attempt) : 1;
}

/** Resolve the worker behind an escrow. */
async function escrowWorkerId(escrowId: string): Promise<string> {
  const { data: escrow, error: escrowError } = await supabase
    .from("escrows")
    .select("bid_id")
    .eq("id", escrowId)
    .maybeSingle();
  if (escrowError) throw new Error(`Escrow read failed for ${escrowId}: ${escrowError.message}`);
  if (!escrow?.bid_id) return "";
  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .select("agent_id")
    .eq("id", escrow.bid_id)
    .maybeSingle();
  if (bidError) throw new Error(`Bid read failed for escrow ${escrowId}: ${bidError.message}`);
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