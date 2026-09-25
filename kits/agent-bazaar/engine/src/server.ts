import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { supabase } from "./supabase.js";
import { seed, ensureAgents } from "./scripts/seed.js";
import { resetEconomy } from "./scripts/reset.js";
import { runRound, parseStatus } from "./orchestrator.js";
import { getBudgetStatus, getMode, tryReserve } from "./budget-governor.js";
import { CLIENT_AGENT } from "./agents/roster.js";
import { postBounty, getLlmStatus, fallbackRubric } from "./flows-client.js";
import { transition } from "./state-machine.js";
import { maybePostAutoTask, countLoad } from "./auto-market.js";
import { checkIdempotencyAsync, releaseIdempotency } from "./idempotency.js";

/** Parse ENGINE_PORT: integer TCP port 1-65535, else documented default 8787. */
function parsePort(raw: string | undefined): number {
  const n = Number(raw ?? "8787");
  return Number.isInteger(n) && n >= 1 && n <= 65535 ? n : 8787;
}
const PORT = parsePort(process.env.ENGINE_PORT);
const HOST = process.env.ENGINE_HOST || "127.0.0.1";
const ENGINE_TOKEN = process.env.ENGINE_TOKEN || "";
const DASHBOARD_ORIGIN = process.env.DASHBOARD_ORIGIN || "http://localhost:3000";

/** Check whether a listener host is loopback-only. */
function isLoopback(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[(.*)\]$/, "$1");
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "::ffff:127.0.0.1";
}

// A non-loopback listener exposes mutating routes to the network: require the
// shared token in that case and fail startup loudly when it is absent. CORS
// stays restricted to the dashboard origin but is not authorization.
if (!isLoopback(HOST) && !ENGINE_TOKEN) {
  console.error(
    `[engine] refusing to listen on non-loopback ${HOST} without ENGINE_TOKEN set`,
  );
  process.exit(1);
}

/** Execute a bridge mutation under a request idempotency key: a retried
 * request carrying an already-seen key is rejected (409) so /task, /round,
 * and /reset never execute twice; requests without a key run directly. A
 * failed operation releases its key before rethrowing, so legitimate retries
 * are not blocked forever. */
async function withBridgeKey<T>(req: IncomingMessage, route: string, op: () => Promise<T>): Promise<T> {
  const header = req.headers["idempotency-key"];
  const key = Array.isArray(header) ? header[0] : header;
  if (!key) return op();
  const scoped = `bridge:${route}:${key}`;
  if (!(await checkIdempotencyAsync(scoped))) {
    throw new HttpError(409, "Duplicate request — already received; check state before retrying");
  }
  try {
    return await op();
  } catch (err) {
    await releaseIdempotency(scoped);
    throw err;
  }
}
/** Guard mutating routes: reject unapproved origins and non-JSON bodies even
 * when ENGINE_TOKEN is empty; Bearer-token validation still applies when it
 * is set. Non-mutating requests are unaffected. */
function requireAuth(req: IncomingMessage): void {
  const method = (req.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    // Dashboard server-actions and curl send no Origin: only a
    // present-but-foreign Origin (browser cross-origin write) is rejected.
    const origin = req.headers.origin;
    if (origin && origin !== DASHBOARD_ORIGIN) {
      throw new HttpError(403, "Forbidden origin");
    }
    const contentLength = req.headers["content-length"];
    const hasBody =
      (typeof contentLength === "string" && contentLength !== "" && contentLength !== "0") ||
      !!req.headers["transfer-encoding"];
    if (hasBody) {
      const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      if (contentType !== "application/json") {
        throw new HttpError(415, "Content-Type must be application/json");
      }
    }
  }
  if (!ENGINE_TOKEN) return;
  const header = req.headers.authorization || "";
  if (header !== `Bearer ${ENGINE_TOKEN}`) {
    throw new HttpError(401, "Unauthorized");
  }
}

let autoRun = true;
let autoMarket = true;
let roundInFlight = false;
let roundStartedAt = 0;
// Shared lifecycle mutex: one holder across the timer auto-round and all
// mutation routes (POST /round, /seed, /reset, /task kick) so a reset can
// never overlap with late writes from an older round. Reuses the round flag
// family — no new module, single boolean source.
let lifecycleInFlight = false;
/** Try to acquire the shared lifecycle mutex; false when busy. */
function acquireLifecycle(): boolean {
  if (lifecycleInFlight) return false;
  lifecycleInFlight = true;
  return true;
}
/** Try to acquire the shared lifecycle mutex with a bounded wait. */
async function acquireLifecycleWithWait(timeoutMs: number = 500): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (acquireLifecycle()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
}
/** Release the shared lifecycle mutex. */
function releaseLifecycle(): void {
  lifecycleInFlight = false;
}

// Ring buffer of recent round failures so stalls are diagnosable.
const recentErrors: Array<{ at: string; message: string }> = [];
/** Record a round error in the ring buffer. */
function noteError(message: string): void {
  recentErrors.push({ at: new Date().toISOString(), message });
  if (recentErrors.length > 20) recentErrors.shift();
}

/** Shared fallback rubric (with passCondition criteria) for posted bounties. */
const FALLBACK_RUBRIC = fallbackRubric();

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Read and parse a JSON request body. */
async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

/** Send a JSON response with dashboard CORS headers. */
function send(res: ServerResponse, status: number, body: unknown): void {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": DASHBOARD_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (status === 204) {
    res.writeHead(status, headers);
    res.end();
    return;
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

/** Validate and post a new bounty task. */
async function postTask(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const goal = typeof body.goal === "string" ? body.goal.trim() : "";
  const budget = Math.round(Number(body.budget));

  if (goal.length < 20 || goal.length > 500) {
    throw new HttpError(400, "Goal must be between 20 and 500 characters");
  }
  if (!Number.isFinite(budget) || budget <= 0) {
    throw new HttpError(400, "Budget must be a positive number");
  }

  // Guarantees the client poster and the three workers exist even on a fresh DB.
  await ensureAgents();

  const bountyId = crypto.randomUUID();
  const openState = transition({ status: "draft" }, "post", {});

  // Insert instantly so the bounty is visible on the board without waiting for
  // the rubric flow. The flow still runs — its rubric upgrades the row when done.
  const { error } = await supabase.from("bounties").insert({
    id: bountyId,
    goal,
    budget,
    status: openState,
    rubric: FALLBACK_RUBRIC,
    posted_by: CLIENT_AGENT.id,
  });
  if (error) {
    // Log details server-side only; callers get a fixed message so raw
    // database internals never leak to POST /task.
    noteError(`postTask bounty insert: ${error.message}`);
    throw new HttpError(500, "Failed to post bounty");
  }

  // Reserve budget before the manual rubric flow; when exhausted, keep the
  // already-stored fallback rubric and skip the Lamatic call entirely.
  const rubricReserved = await tryReserve(1);
  if (rubricReserved) {
    void postBounty({ goal, budget })
      .then(async (posted) => {
        if (posted.rubric) {
          await supabase.from("bounties").update({ rubric: posted.rubric }).eq("id", bountyId);
        }
      })
      .catch(() => {
        // Flow unavailable — fallback rubric already stored keeps things moving.
      });
  } else {
    console.log(`[budget] exhausted — bounty ${bountyId} keeping fallback rubric, skipping postBounty flow`);
  }

  return { bountyId, goal, budget, rubric: FALLBACK_RUBRIC };
}

/** Build a single-bounty graph snapshot. */
async function bountySnapshot(bountyId: string): Promise<Record<string, unknown> | null> {
  const { data: bounty } = await supabase
    .from("bounties")
    .select("*")
    .eq("id", bountyId)
    .maybeSingle();
  if (!bounty) return null;

  const [bidsRes, escrowRes, deliveriesRes, verdictsRes, receiptsRes] = await Promise.all([
    supabase.from("bids").select("*").eq("bounty_id", bountyId).order("created_at", { ascending: true }),
    supabase.from("escrows").select("*").eq("bounty_id", bountyId).maybeSingle(),
    supabase.from("deliveries").select("*").eq("bounty_id", bountyId).order("attempt", { ascending: false }),
    supabase.from("qa_verdicts").select("*").eq("bounty_id", bountyId).order("created_at", { ascending: false }),
    supabase.from("settlement_receipts").select("*").eq("bounty_id", bountyId).order("created_at", { ascending: false }),
  ]);

  const bids = bidsRes.data ?? [];
  const agentIds = [...new Set(bids.map((b) => b.agent_id as string))];
  const agentsRes = agentIds.length
    ? await supabase
        .from("agents")
        .select("id,name,specialty,reputation,wins,losses")
        .in("id", agentIds)
    : { data: [] as Array<Record<string, unknown>> };

  return {
    bounty,
    bids,
    escrow: escrowRes.data ?? null,
    delivery: deliveriesRes.data?.[0] ?? null,
    verdict: verdictsRes.data?.[0] ?? null,
    receipt: receiptsRes.data?.[0] ?? null,
    agents: agentsRes.data ?? [],
  };
}

/** Build the full dashboard market snapshot. */
async function marketSnapshot(): Promise<Record<string, unknown>> {
  const [bountiesRes, bidsRes, escrowsRes, deliveriesRes, verdictsRes, receiptsRes, ledgerRes, agentsRes] =
    await Promise.all([
      supabase.from("bounties").select("*").order("created_at", { ascending: false }).limit(25),
      supabase.from("bids").select("*").order("created_at", { ascending: false }).limit(60),
      supabase.from("escrows").select("*").order("created_at", { ascending: false }).limit(25),
      supabase.from("deliveries").select("*").order("created_at", { ascending: false }).limit(25),
      supabase.from("qa_verdicts").select("*").order("created_at", { ascending: false }).limit(25),
      supabase.from("settlement_receipts").select("*").order("created_at", { ascending: false }).limit(40),
      supabase.from("credit_ledger").select("*").order("seq", { ascending: false }).limit(150),
      supabase.from("agents").select("*"),
    ]);

  const bounties = (bountiesRes.data ?? []).map((b) => ({
    ...b,
    status: (b.status as { status?: string } | null)?.status ?? String(b.status ?? "unknown"),
  }));

  const ledger = ledgerRes.data ?? [];
  // Derive balances from each agent's latest ledger entry, not the 150-row
  // display window — agents with many transactions beyond the window no
  // longer default to 0.
  const agentIds = [...new Set((agentsRes.data ?? []).map((a) => a.id as string))];
  const balances = new Map<string, number>();
  for (const id of agentIds) {
    const { data: latest } = await supabase
      .from("credit_ledger")
      .select("balance_after")
      .eq("agent_id", id)
      .order("seq", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) balances.set(id, Number(latest.balance_after));
  }
  const agents = (agentsRes.data ?? [])
    .map((a) => ({
      ...a,
      role: a.id === CLIENT_AGENT.id ? "client" : "worker",
      balance: balances.get(a.id as string) ?? 0,
    }))
    .sort((a, b) => (a.role === b.role ? 0 : a.role === "client" ? -1 : 1));

  const escrows = escrowsRes.data ?? [];
  const receipts = receiptsRes.data ?? [];
  const verdicts = verdictsRes.data ?? [];
  const locked = escrows.filter((e) => e.status === "locked");

  return {
    bounties,
    bids: bidsRes.data ?? [],
    escrows,
    deliveries: deliveriesRes.data ?? [],
    verdicts,
    receipts,
    ledger,
    agents,
    stats: {
      totalSettled: bounties.filter((b) => b.status === "settled").length,
      activeEscrows: locked.length,
      escrowValue: locked.reduce((s, e) => s + Number(e.amount), 0),
      feesCollected: receipts.reduce((s, r) => s + Number(r.fee_amount), 0),
      avgQaScore: verdicts.length
        ? verdicts.reduce((s, v) => s + Number(v.score), 0) / verdicts.length
        : 0,
      receipts: receipts.length,
    },
    budget: getBudgetStatus(),
    serverTime: new Date().toISOString(),
  };
}

/** Build the engine stall diagnostics report. */
async function stallReport(): Promise<Record<string, unknown>> {
  const [bountiesRes, bidsRes] = await Promise.all([
    supabase.from("bounties").select("id,status,created_at,updated_at"),
    supabase.from("bids").select("bounty_id").limit(1000),
  ]);

  const histogram: Record<string, number> = {
    open: 0,
    awarded: 0,
    in_escrow: 0,
    delivered: 0,
    qa_pass: 0,
    qa_fail: 0,
    settled: 0,
    refunded: 0,
    unparseable: 0,
  };
  const openIds: string[] = [];
  for (const row of (bountiesRes.data ?? []) as Array<Record<string, unknown>>) {
    const parsed = parseStatus(row.status);
    if (!parsed || !(parsed.status in histogram)) {
      histogram.unparseable++;
      continue;
    }
    histogram[parsed.status]++;
    if (parsed.status === "open") openIds.push(row.id as string);
  }

  const bidsPerBounty = new Map<string, number>();
  for (const bid of (bidsRes.data ?? []) as Array<Record<string, unknown>>) {
    const id = bid.bounty_id as string;
    bidsPerBounty.set(id, (bidsPerBounty.get(id) ?? 0) + 1);
  }
  let openWithBids = 0;
  let openWithoutBids = 0;
  const oldestStuckOpen: Array<{ id: string; bids: number; updated_at: unknown }> = [];
  for (const id of openIds) {
    const n = bidsPerBounty.get(id) ?? 0;
    if (n > 0) openWithBids++;
    else openWithoutBids++;
  }
  const openRows = ((bountiesRes.data ?? []) as Array<Record<string, unknown>>)
    .filter((r) => openIds.includes(r.id as string))
    .sort((a, b) => String(a.updated_at).localeCompare(String(b.updated_at)))
    .slice(0, 5);
  for (const r of openRows) {
    oldestStuckOpen.push({
      id: r.id as string,
      bids: bidsPerBounty.get(r.id as string) ?? 0,
      updated_at: r.updated_at,
    });
  }

  return {
    time: new Date().toISOString(),
    budget: getBudgetStatus(),
    mode: getMode(),
    llm: getLlmStatus(),
    auto: { run: autoRun, market: autoMarket },
    roundInFlight: roundInFlight || lifecycleInFlight,
    roundAgeMs: roundInFlight || lifecycleInFlight ? Date.now() - roundStartedAt : 0,
    load: await countLoad(),
    histogram,
    openWithBids,
    openWithoutBids,
    oldestStuckOpen,
    recentErrors,
  };
}

/** Run one round for a bounty and snapshot it. */
async function postRound(body: Record<string, unknown>): Promise<Record<string, unknown>> {  const bountyId = typeof body.bountyId === "string" ? body.bountyId : undefined;
  const result = await runRound({ bountyId, record: false });
  const snapshot = bountyId ? await bountySnapshot(bountyId) : null;
  return { result, snapshot };
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, null);
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      send(res, 200, {
        ok: true,
        client: CLIENT_AGENT.name,
        budget: getBudgetStatus(),
        auto: { run: autoRun, market: autoMarket },
        llm: getLlmStatus(),
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/market") {
      send(res, 200, await marketSnapshot());
      return;
    }

    if (req.method === "GET" && url.pathname === "/debug/stall") {
      requireAuth(req);
      send(res, 200, await stallReport());
      return;
    }

    if (req.method === "GET" && url.pathname === "/state") {
      const bountyId = url.searchParams.get("bountyId");
      if (!bountyId) {
        send(res, 200, { budget: getBudgetStatus() });
        return;
      }
      const snapshot = await bountySnapshot(bountyId);
      if (!snapshot) throw new HttpError(404, "Bounty not found");
      send(res, 200, snapshot);
      return;
    }

    if (req.method === "POST" && url.pathname === "/task") {
      requireAuth(req);
      if (!(await acquireLifecycleWithWait(30_000))) throw new HttpError(409, "Engine busy — lifecycle operation in flight; retry");
      let result: Record<string, unknown>;
      try {
        result = await withBridgeKey(req, "task", async () => postTask(await readJson(req)));
      } finally {
        releaseLifecycle();
      }
      send(res, 200, result);
      // Fire-and-forget: trigger a round immediately so bids start processing
      if (!lifecycleInFlight && !roundInFlight) {
        if (!acquireLifecycle()) return;
        roundInFlight = true;
        roundStartedAt = Date.now();
        void runRound({ bountyId: result.bountyId as string, record: false })
          .catch((err) => {
            const msg = `POST /task kick failed: ${(err as Error).message}`;
            console.error(`[engine] ${msg}`);
            noteError(msg);
          })
          .finally(() => { roundInFlight = false; releaseLifecycle(); });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/auto") {
      requireAuth(req);
      const body = await readJson(req);
      if (typeof body.run === "boolean") autoRun = body.run;
      if (typeof body.market === "boolean") autoMarket = body.market;
      send(res, 200, { auto: { run: autoRun, market: autoMarket } });
      return;
    }

    if (req.method === "POST" && url.pathname === "/round") {
      requireAuth(req);
      if (!acquireLifecycle()) throw new HttpError(409, "Engine busy — lifecycle operation in flight; retry");
      try {
        send(res, 200, await withBridgeKey(req, "round", async () => postRound(await readJson(req))));
      } finally {
        releaseLifecycle();
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/seed") {
      requireAuth(req);
      if (!acquireLifecycle()) throw new HttpError(409, "Engine busy — lifecycle operation in flight; retry");
      try {
        await seed();
      } finally {
        releaseLifecycle();
      }
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/reset") {
      requireAuth(req);
      if (!acquireLifecycle()) throw new HttpError(409, "Engine busy — lifecycle operation in flight; retry");
      try {
        await withBridgeKey(req, "reset", async () => {
          const body = await readJson(req);
          await resetEconomy({ reseed: body.reseed !== false });
        });
      } finally {
        releaseLifecycle();
      }
      send(res, 200, { ok: true });
      return;
    }

    send(res, 404, { error: "Not found" });
  } catch (err) {
    if (err instanceof HttpError) {
      send(res, err.status, { error: err.message });
      return;
    }
    console.error(`[engine] unhandled request error:`, err);
    noteError(err instanceof Error ? err.message : String(err));
    send(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, HOST, async () => {
  console.log(`Agent Bazaar engine listening on http://${HOST}:${PORT}`);

  // Auto-seed agents on startup
  try {
    await ensureAgents();
    console.log("  Agents ensured: Client-Alpha + 3 workers");
  } catch (err) {
    console.error("  Agent seeding failed:", (err as Error).message);
  }

  // Auto-run: process bounties every second (guarded by shared lifecycle mutex)
  let round = 0;
  setInterval(async () => {
    if (lifecycleInFlight || roundInFlight) {
      const ageS = Math.round((Date.now() - roundStartedAt) / 1000);
      if (ageS >= 60) {
        console.error(`[watchdog] round stuck for ${ageS}s — ticks skipping, check hung flow/DB call`);
      }
      return;
    }
    if (!acquireLifecycle()) return;
    roundInFlight = true;
    roundStartedAt = Date.now();
    try {
      if (autoMarket) {
        await maybePostAutoTask();
      }
      if (autoRun) {
        round++;
        const result = await runRound({ record: false });
        const budget = getBudgetStatus();
        const errSuffix =
          result.errors.length > 0 ? ` errors=[${result.errors.join(" | ")}]` : "";
        console.log(
          `[auto-round ${round}] processed=${result.bountiesProcessed} settled=${result.settlements} refunded=${result.refunds} mode=${getMode()} budget=${budget.remaining}/${budget.daily}${errSuffix}`,
        );
        for (const msg of result.errors) {
          console.error(`[auto-round ${round}] error: ${msg}`);
          noteError(msg);
        }
      }
    } catch (err) {
      const msg = `tick failed: ${(err as Error).message}`;
      console.error(`[auto-round] ${msg}`);
      noteError(msg);
    } finally {
      roundInFlight = false;
      releaseLifecycle();
    }
  }, 1000);

  console.log("  Auto-run: processing bounties every 1s");
  console.log("  Auto-market: max 2 pre-QA tasks (3rd slot opens at QA), 15s cooldown");
  console.log("  GET  /health");
  console.log("  GET  /market");
  console.log("  GET  /debug/stall");
  console.log("  GET  /state?bountyId=<id>");
  console.log("  POST /task   { goal, budget }");
  console.log("  POST /round  { bountyId }");
  console.log("  POST /auto   { run?, market? }");
  console.log("  POST /seed");
  console.log("  POST /reset  { reseed }");
});
