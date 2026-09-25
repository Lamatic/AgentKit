import { runRound } from "../orchestrator.js";
import { resetIdempotency } from "../idempotency.js";
import { supabase } from "../supabase.js";
import { seed } from "./seed.js";
import { clearAll } from "./reset.js";
import { deterministicUUID } from "./uuid.js";
import { CLIENT_AGENT } from "../agents/roster.js";

/** Guarded wrapper around the shared destructive reset (opt-in only). */
async function clearAllGuarded(): Promise<void> {
  if (process.env.AGENT_BAZAAR_ALLOW_DESTRUCTIVE !== "true") {
    throw new Error(
      "Refusing to clear all tables: set AGENT_BAZAAR_ALLOW_DESTRUCTIVE=true to opt in.",
    );
  }
  await clearAll();
}

/** Run the end-to-end demo sequence. */
async function demo(): Promise<void> {
  console.log("=== Agent Bazaar Demo ===\n");

  console.log("Step 1: Clearing previous data...");
  await clearAllGuarded();
  console.log("Previous data cleared.");

  console.log("\nStep 2: Seeding database (settled history)...");
  await seed();

  console.log("\nStep 3: Posting a live bounty...");

  // The live bounty is posted by the dedicated client agent, matching every
  // other bounty-posting flow (never a worker).
  const posterId = CLIENT_AGENT.id;
  const liveBountyId = deterministicUUID("live-bounty-demo");

  const { error: liveErr } = await supabase.from("bounties").insert({
    id: liveBountyId,
    goal: "Summarize three SEC filings into investor-risk bullet points",
    budget: 1200,
    status: { status: "open", bids: [], closeAt: Date.now() + 86400_000 },
    rubric: {
      criteria: [
        { name: "Completeness", weight: 0.4, description: "Covers all risk factors" },
        { name: "Accuracy", weight: 0.3, description: "No factual errors" },
        { name: "Format", weight: 0.3, description: "Concise bullets" },
      ],
      maxScore: 1.0,
    },
    posted_by: posterId,
  });
  if (liveErr) throw liveErr;

  console.log("  Live bounty posted (open → bid → escrow → deliver → QA → settle)\n");

  let last: { bountiesProcessed: number; settlements: number; refunds: number; errors: string[] };
  for (let round = 1; round <= 6; round++) {
    resetIdempotency();
    last = await runRound({ record: true, roundId: `demo-round-${round}` });
    const { data: status } = await supabase
      .from("bounties")
      .select("status")
      .eq("id", liveBountyId)
      .single();
    console.log(
      `Round ${round}: processed=${last.bountiesProcessed} settled=${last.settlements} refunded=${last.refunds} live=${status?.status?.status ?? "?"}`,
    );
    if ((status?.status?.status as string) === "settled") {
      console.log("\nLive bounty settled. Economy converged.");
      break;
    }
  }

  const { data: finalBounty } = await supabase
    .from("bounties")
    .select("id,status")
    .eq("id", liveBountyId)
    .single();
  console.log(`\nFinal live bounty state: ${finalBounty?.status?.status}`);

  const { count: receiptCount } = await supabase
    .from("settlement_receipts")
    .select("*", { count: "exact", head: true });
  const { count: escrowCount } = await supabase
    .from("escrows")
    .select("*", { count: "exact", head: true });
  console.log(`Database: ${escrowCount} escrows, ${receiptCount} receipts`);

  console.log("\nDemo complete.");
}

demo().catch(console.error);