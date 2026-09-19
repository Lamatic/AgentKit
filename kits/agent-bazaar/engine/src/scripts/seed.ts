import "dotenv/config";
import { pathToFileURL } from "node:url";
import { supabase } from "../supabase.js";
import { transition } from "../state-machine.js";
import type { Bid, BountyStatus } from "../state-machine.js";
import { deterministicUUID, workerWalletAddress } from "./uuid.js";
import { appendLedger } from "../settlement/ledger-adapter.js";
import { CLIENT_AGENT, ROSTER } from "../agents/roster.js";

const SEED_AGENTS: Array<{ name: string; specialty: string }> = [
  { name: "Summarizer-Alpha", specialty: "summarizer" },
  { name: "Researcher-Bravo", specialty: "researcher" },
  { name: "Datagen-Charlie", specialty: "datagen" },
];

const SEED_BOUNTIES: Array<{ goal: string; budget: number; specialist: string }> = [
  {
    goal: "Summarize this 10-page research paper into 3 bullet points",
    budget: 1000,
    specialist: "summarizer",
  },
  {
    goal: "Research the top 5 competitors in the AI agent space",
    budget: 2500,
    specialist: "researcher",
  },
  {
    goal: "Generate a dataset of 100 product descriptions from specifications",
    budget: 1500,
    specialist: "datagen",
  },
];

const WORKER_GRANT = 10_000;
const CLIENT_GRANT = 100_000;

/** agentId helper. */
function agentId(name: string): string {
  return deterministicUUID(`agent-${name.toLowerCase()}`);
}

/** hoursAgo helper. */
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

const SEED_AGENT_IDS = SEED_AGENTS.map((a) => agentId(a.name));
const ALL_AGENT_IDS = [...SEED_AGENT_IDS, CLIENT_AGENT.id];
const SEED_BOUNTY_IDS = SEED_BOUNTIES.map((_, i) => deterministicUUID(`bounty-${i}`));

/**
 * Removes only the rows owned by the deterministic seed (its agents' history and
 * its three bounties). Live/interactive rows posted by other bounties are left
 * untouched, so `seed()` can be re-run safely.
 */
/** cleanupSeed helper. */
async function cleanupSeed(): Promise<void> {
  const scopedDeletes: Array<[string, "bounty_id" | "agent_id" | "id", string[]]> = [
    ["settlement_receipts", "bounty_id", SEED_BOUNTY_IDS],
    ["qa_verdicts", "bounty_id", SEED_BOUNTY_IDS],
    ["deliveries", "bounty_id", SEED_BOUNTY_IDS],
    ["escrows", "bounty_id", SEED_BOUNTY_IDS],
    ["bids", "bounty_id", SEED_BOUNTY_IDS],
    ["bounties", "id", SEED_BOUNTY_IDS],
  ];
  for (const [table, column, ids] of scopedDeletes) {
    const { error } = await supabase.from(table).delete().in(column, ids);
    if (error) throw new Error(`seed cleanup ${table}: ${error.message}`);
  }

  // Seed transaction history hangs off ref_id; initial grants are keyed to the
  // agent and handled separately below.
  const { error: ledgerErr } = await supabase
    .from("credit_ledger")
    .delete()
    .in("ref_id", SEED_BOUNTY_IDS);
  if (ledgerErr) throw new Error(`seed cleanup credit_ledger: ${ledgerErr.message}`);
}

/** Ensure seed agents exist in the database. */
export async function ensureAgents(): Promise<void> {
  const workerRows = SEED_AGENTS.map((a) => ({
    id: agentId(a.name),
    name: a.name,
    specialty: a.specialty,
    wallet_address: workerWalletAddress(a.name),
  }));
  const clientRow = {
    id: CLIENT_AGENT.id,
    name: CLIENT_AGENT.name,
    specialty: CLIENT_AGENT.specialty,
    wallet_address: CLIENT_AGENT.wallet,
  };

  const { error } = await supabase
    .from("agents")
    .upsert([...workerRows, clientRow], { onConflict: "id" });

  if (error) {
    if (!error.message.includes("agents_specialty_check")) {
      throw new Error(`seed agents upsert: ${error.message}`);
    }
    // The DB predates migration 002, which widens the specialty CHECK to allow
    // the dedicated client role. Fall back to a worker specialty so the market
    // still runs; run the migration to store the real 'client' role.
    const retry = await supabase
      .from("agents")
      .upsert([...workerRows, { ...clientRow, specialty: "summarizer" }], {
        onConflict: "id",
      });
    if (retry.error) throw new Error(`seed agents upsert: ${retry.error.message}`);
    console.warn(
      "  ! agents_specialty_check restricts specialties — run " +
        "engine/migrations/002_client_agent_and_live_source.sql to enable the client role.",
    );
  }

  for (const id of SEED_AGENT_IDS) {
    await ensureInitialGrant(id, WORKER_GRANT);
  }
  await ensureInitialGrant(CLIENT_AGENT.id, CLIENT_GRANT);
}

/** ensureInitialGrant helper. */
async function ensureInitialGrant(agentIdValue: string, amount: number): Promise<void> {
  const { data, error } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("agent_id", agentIdValue)
    .eq("reason", "initial_grant")
    .limit(1);
  if (error) throw new Error(`seed grant lookup: ${error.message}`);
  if (data && data.length > 0) return;

  try {
    await appendLedger(agentIdValue, String(amount), "initial_grant", undefined, {
      source: "seed",
      createdAt: hoursAgo(72),
    });
  } catch (err) {
    throw new Error(`seed grant insert: ${(err as Error).message}`);
  }
}

/** appendSeedLedger helper: seed writes go through the shared atomic RPC so
 * history balances follow real append order; source/created_at metadata is
 * preserved via the RPC's supported parameters. */
async function appendSeedLedger(
  agentIdValue: string,
  amount: number,
  reason: string,
  refId: string,
  createdAt: string,
): Promise<void> {
  try {
    await appendLedger(agentIdValue, String(amount), reason, refId, {
      source: "seed",
      createdAt,
    });
  } catch (err) {
    throw new Error(`seed ledger append: ${(err as Error).message}`);
  }
}

/** Seed deterministic marketplace history. */
export async function seed(): Promise<void> {
  console.log("Seeding Agent Bazaar economy...");

  await cleanupSeed();
  await ensureAgents();
  console.log(`  Agents ready: ${ROSTER.length} workers + ${CLIENT_AGENT.name}`);

  for (let i = 0; i < SEED_BOUNTIES.length; i++) {
    const bountyDef = SEED_BOUNTIES[i];
    const workerAgentId = agentId(
      SEED_AGENTS.find((a) => a.specialty === bountyDef.specialist)!.name,
    );

    const bountyId = SEED_BOUNTY_IDS[i];
    const posted = hoursAgo(48 - i * 8);

    let status: BountyStatus = { status: "draft" };
    status = transition(status, "post", {});
    const openState = {
      ...(status as { status: "open"; bids: Bid[]; closeAt: number }),
      closeAt: Date.now() - (24 - i * 8) * 3600_000,
    };

    const { error: bountyErr } = await supabase.from("bounties").insert({
      id: bountyId,
      goal: bountyDef.goal,
      budget: bountyDef.budget,
      status: openState,
      rubric: {
        criteria: [
          { name: "Completeness", weight: 0.4, description: "Covers all required aspects" },
          { name: "Accuracy", weight: 0.3, description: "Factual and correct" },
          { name: "Format", weight: 0.3, description: "Follows requested format" },
        ],
        maxScore: 1.0,
      },
      posted_by: CLIENT_AGENT.id,
      created_at: posted,
      updated_at: posted,
    });
    if (bountyErr) throw bountyErr;

    const bidId = deterministicUUID(`bid-${i}`);
    const bidPrice = Math.round(bountyDef.budget * 0.8);
    const { error: bidErr } = await supabase.from("bids").insert({
      id: bidId,
      bounty_id: bountyId,
      agent_id: workerAgentId,
      price: bidPrice,
      eta_hours: 2 + i,
      pitch: `I can handle this ${bountyDef.specialist} task with high quality.`,
      capability: `capabilities/${bountyDef.specialist}.md`,
      created_at: hoursAgo(40 - i * 8),
    });
    if (bidErr) throw bidErr;

    const escrowId = deterministicUUID(`escrow-${i}`);
    const lockRef = `seed-lock-${i}`;
    const { error: escrowErr } = await supabase.from("escrows").insert({
      id: escrowId,
      bounty_id: bountyId,
      bid_id: bidId,
      amount: bidPrice,
      lock_ref: lockRef,
      status: "locked",
      created_at: hoursAgo(36 - i * 8),
    });
    if (escrowErr) throw escrowErr;

    let st: BountyStatus = openState;
    st = transition(st, "award", { bidId });
    await supabase
      .from("bounties")
      .update({ status: st, updated_at: hoursAgo(36 - i * 8) })
      .eq("id", bountyId);

    st = transition(st, "lock_escrow", { escrowId, lockRef });
    await supabase
      .from("bounties")
      .update({ status: st, updated_at: hoursAgo(36 - i * 8) })
      .eq("id", bountyId);

    const deliveryId = deterministicUUID(`delivery-${i}`);
    const { error: delErr } = await supabase.from("deliveries").insert({
      id: deliveryId,
      bounty_id: bountyId,
      attempt: 1,
      artifact: { result: `Seed artifact for bounty ${i}`, format: "json" },
      summary: `Completed ${bountyDef.specialist} task as specified.`,
      created_at: hoursAgo(32 - i * 8),
    });
    if (delErr) throw delErr;

    st = transition(st, "deliver", { deliveryId, attempt: 1 });
    await supabase
      .from("bounties")
      .update({ status: st, updated_at: hoursAgo(32 - i * 8) })
      .eq("id", bountyId);

    const score = 0.85 + i * 0.05;
    const verdictId = deterministicUUID(`verdict-${i}`);
    const { error: qaErr } = await supabase.from("qa_verdicts").insert({
      id: verdictId,
      bounty_id: bountyId,
      delivery_id: deliveryId,
      score,
      verdict: "pass",
      rationale: "Meets all rubric criteria. Quality output.",
      rubric_hash: `seed-rubric-${i}`,
      created_at: hoursAgo(28 - i * 8),
    });
    if (qaErr) throw qaErr;

    st = transition(st, "qa_pass", {
      verdict: {
        score,
        verdict: "pass",
        rationale: "Meets all rubric criteria.",
        rubric_hash: `seed-rubric-${i}`,
      },
    });
    await supabase
      .from("bounties")
      .update({ status: st, updated_at: hoursAgo(28 - i * 8) })
      .eq("id", bountyId);

    const feeAmount = Math.round(bidPrice * 0.1);
    const netAmount = bidPrice - feeAmount;
    const receiptId = deterministicUUID(`receipt-${i}`);
    const { error: receiptErr } = await supabase.from("settlement_receipts").insert({
      id: receiptId,
      bounty_id: bountyId,
      escrow_id: escrowId,
      from_agent: CLIENT_AGENT.id,
      to_agent: workerAgentId,
      gross_amount: bidPrice,
      fee_amount: feeAmount,
      net_amount: netAmount,
      tx_hash: null,
      adapter: "ledger",
      created_at: hoursAgo(24 - i * 8),
    });
    if (receiptErr) throw receiptErr;

    await supabase
      .from("escrows")
      .update({ status: "settled", settled_at: hoursAgo(24 - i * 8) })
      .eq("id", escrowId);

    st = transition(st, "settle", { receiptId });
    await supabase
      .from("bounties")
      .update({ status: st, updated_at: hoursAgo(24 - i * 8) })
      .eq("id", bountyId);

    const settledAt = new Date(new Date(hoursAgo(24 - i * 8)).getTime());
    // Poster pays exactly the gross bid (locked once); worker takes net and
    // the fee lives on the receipt — no second poster debit.
    await appendSeedLedger(CLIENT_AGENT.id, -bidPrice, "bid_lock", bountyId, settledAt.toISOString());
    await appendSeedLedger(workerAgentId, netAmount, "settlement", bountyId, new Date(settledAt.getTime() + 1).toISOString());

    console.log(
      `  Bounty ${i + 1}: ${bountyDef.goal.substring(0, 40)}... → settled (score: ${score})`,
    );
  }

  // Deterministic post-history for the seed: every worker landed exactly one pass.
  for (const a of SEED_AGENTS) {
    await supabase
      .from("agents")
      .update({ reputation: 0.55, wins: 1, losses: 0 })
      .eq("id", agentId(a.name));
  }

  console.log("Seed complete. All bounties settled.");
}

const isEntry =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  seed().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
