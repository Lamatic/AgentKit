import { supabase } from "./supabase.js";
import { CLIENT_AGENT } from "./agents/roster.js";
import { transition } from "./state-machine.js";
import { postBounty } from "./flows-client.js";
import { canSpend, recordSpend } from "./budget-governor.js";
import { parseStatus } from "./orchestrator.js";

const MAX_EARLY = Number(process.env.AUTO_MARKET_MAX_EARLY || process.env.AUTO_MARKET_MAX_ACTIVE || "2");
const MAX_TOTAL = Number(process.env.AUTO_MARKET_MAX_TOTAL || "3");
const COOLDOWN_MS = Number(process.env.AUTO_MARKET_COOLDOWN_MS || "15000");

const TERMINAL_STATES = new Set(["settled", "refunded"]);
const QA_STATES = new Set(["qa_pass", "qa_fail"]);

export interface MarketLoad {
  early: number;
  qa: number;
  total: number;
}

/** Live load by pipeline stage. The status column is jsonb, so the `.not(..in..)`
 *  DB-side filter can't be trusted — count parsed statuses in JS instead. */
export async function countLoad(): Promise<MarketLoad> {
  const { data } = await supabase.from("bounties").select("id,status");
  let early = 0;
  let qa = 0;
  for (const row of data ?? []) {
    const parsed = parseStatus((row as Record<string, unknown>).status);
    if (!parsed || TERMINAL_STATES.has(parsed.status)) continue;
    if (QA_STATES.has(parsed.status)) qa++;
    else early++;
  }
  return { early, qa, total: early + qa };
}

const FALLBACK_RUBRIC = {
  criteria: [
    { name: "Completeness", weight: 0.4, description: "Covers all requirements" },
    { name: "Accuracy", weight: 0.3, description: "Factually correct" },
    { name: "Quality", weight: 0.3, description: "Meets professional standards" },
  ],
  maxScore: 1.0,
};

const TASK_POOL: Array<{ goal: string; budget: number }> = [
  { goal: "Analyze the latest Q2 earnings report for NVIDIA and summarize key metrics", budget: 800 },
  { goal: "Research the top 5 AI coding assistants and compare their feature sets", budget: 1200 },
  { goal: "Summarize the EU AI Act compliance requirements for enterprise SaaS companies", budget: 950 },
  { goal: "Draft a technical architecture proposal for a real-time notification system", budget: 1500 },
  { goal: "Create a competitive landscape analysis of the agent orchestration market in 2025", budget: 1100 },
  { goal: "Extract and categorize all risk factors from the latest Tesla 10-K filing", budget: 700 },
  { goal: "Benchmark latency and throughput of three vector databases for RAG workloads", budget: 1300 },
  { goal: "Generate a go-to-market strategy brief for an AI agent marketplace platform", budget: 1600 },
  { goal: "Summarize regulatory changes affecting cryptocurrency custody in the US", budget: 850 },
  { goal: "Research emerging trends in multi-agent orchestration and produce a report", budget: 1000 },
  { goal: "Analyze customer sentiment from the latest product review dataset", budget: 750 },
  { goal: "Draft a whitepaper outline on zero-knowledge proofs for AI model verification", budget: 1400 },
  { goal: "Compare pricing models of the top 10 enterprise AI platforms", budget: 900 },
  { goal: "Research best practices for productionizing LLM-based agents at scale", budget: 1100 },
  { goal: "Evaluate security audit findings for common AI agent vulnerabilities", budget: 1050 },
];

let lastAutoPostAt = 0;
const recentlyUsedGoals = new Set<string>();

export async function maybePostAutoTask(): Promise<boolean> {
  const now = Date.now();
  if (now - lastAutoPostAt < COOLDOWN_MS) return false;

  // Cap policy: at most MAX_EARLY pre-QA bounties in flight. Once something
  // reaches QA, one extra slot opens (up to MAX_TOTAL) so the board keeps
  // draining instead of stalling behind the QA/commit tail.
  const load = await countLoad();
  const allow = load.total < MAX_EARLY || (load.qa >= 1 && load.total < MAX_TOTAL);
  if (!allow) return false;

  const available = TASK_POOL.filter((t) => !recentlyUsedGoals.has(t.goal));
  if (available.length === 0) {
    recentlyUsedGoals.clear();
    return false;
  }

  const candidate = available[Math.floor(Math.random() * available.length)];
  recentlyUsedGoals.add(candidate.goal);
  if (recentlyUsedGoals.size > TASK_POOL.length - 3) {
    recentlyUsedGoals.clear();
  }

  const bountyId = crypto.randomUUID();
  const openState = transition({ status: "draft" }, "post", {});

  // Insert instantly; the rubric flow still runs and upgrades the row when done.
  const { error } = await supabase.from("bounties").insert({
    id: bountyId,
    goal: candidate.goal,
    budget: candidate.budget,
    status: openState,
    rubric: FALLBACK_RUBRIC,
    posted_by: CLIENT_AGENT.id,
  });
  if (error) {
    console.error(`[auto-market] failed to insert bounty: ${error.message}`);
    return false;
  }

  if (canSpend(1)) {
    recordSpend(1);
    void postBounty({ goal: candidate.goal, budget: candidate.budget })
      .then(async (posted) => {
        if (posted.rubric) {
          await supabase.from("bounties").update({ rubric: posted.rubric }).eq("id", bountyId);
        }
      })
      .catch(() => {
        // Flow unavailable — fallback rubric already stored keeps things moving.
      });
  }

  lastAutoPostAt = now;
  console.log(`[auto-market] posted ${bountyId} — "${candidate.goal.slice(0, 60)}…" (${candidate.budget} CRT)`);
  return true;
}
