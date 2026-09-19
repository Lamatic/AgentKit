import { runRound } from "../orchestrator.js";
import { resetIdempotency } from "../idempotency.js";
import { supabase } from "../supabase.js";
import { seed } from "./seed.js";
import { deterministicUUID } from "./uuid.js";

const ALL_ZERO = "00000000-0000-0000-0000-000000000000";

async function clearAll(): Promise<void> {
  const tables = [
    "settlement_receipts",
    "qa_verdicts",
    "credit_ledger",
    "deliveries",
    "escrows",
    "bids",
    "bounties",
    "agents",
  ];
  for (const table of tables) {
    await supabase.from(table).delete().neq("id", ALL_ZERO);
  }
}

async function demo(): Promise<void> {
  console.log("=== Agent Bazaar Demo ===\n");

  console.log("Step 1: Clearing previous data...");
  await clearAll();
  console.log("Previous data cleared.");

  console.log("\nStep 2: Seeding database (settled history)...");
  await seed();

  console.log("\nStep 3: Posting a live bounty...");

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("name", "Summarizer-Alpha")
    .single();

  const posterId = agent?.id || deterministicUUID("agent-summarizer-alpha");
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