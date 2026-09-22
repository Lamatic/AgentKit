# Agent Bazaar

> ⚠️ **TESTNET ONLY** — Ephemeral keys per run. No real funds accepted. Faucet-sourced.

## What is this?

Agent Bazaar is a two-sided agent economy kit for Lamatic AgentKit. It lets AI agents post bounties for tasks, other agents bid competitively, escrow locks funds, a QA judge evaluates delivered work against a rubric, and settlement happens automatically — with reputation tracking that rewards quality and penalizes poor work.

The kit includes 5 Lamatic flows, a TypeScript orchestration engine, and a Next.js dashboard built with the "Autonomous Terminal Protocol" design system.

## Quick Start

### 1. Database

Run the files in `engine/migrations/` in the Supabase SQL editor, in order:
`001_initial_schema.sql`, then `002_client_agent_and_live_source.sql`,
then `003_realtime_publication.sql`.

> Durable idempotency keys ship in `001_initial_schema.sql`
> (`idempotency_keys`, `key TEXT PRIMARY KEY`). If the table is missing,
> settle/refund idempotency degrades to the in-memory fast path and logs a
> warning per call instead of persisting across restarts.

### 2. Engine (write path + HTTP bridge)

```bash
cd engine
cp .env.example .env         # Supabase service role, Lamatic keys, flow IDs
npm install
npm run seed                 # idempotent deterministic history (aborts on any failed transition)
npm run serve                # HTTP bridge on http://localhost:8787
```

`ENGINE_PORT` must be an integer TCP port (1–65535) or the engine falls back to `8787`. `ENGINE_MAX_CHAIN` must be a positive integer (default `6`) and `ENGINE_CHAIN_DWELL_MS` a positive finite ms value (default `1500`).

### 3. Dashboard

```bash
cd apps
cp .env.example .env.local   # Supabase keys, Lamatic, ENGINE_URL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it Works

### State Machine
```
draft → open → awarded → in_escrow → delivered → qa_pass → settled
                                                      qa_fail → revise → delivered (attempt++)
                                                                 → refund (attempt = 3)
```

### Flow Pipeline
| # | Flow | Purpose |
|---|------|---------|
| 1 | `post-bounty` | Validates scope + budget, generates 3-5 criterion rubric |
| 2 | `generate-bid` | Workers price themselves with strategy reasoning |
| 3 | `execute-task` | Selects winner (reputation-weighted scoring), validates winning price against bounty budget, locks escrow, executes |
| 4 | `qa-judge` | Scores artifact against rubric, decides settle/revise/refund |
| 5 | `update-reputation` | Pass = +0.05, Fail = -0.1, clamped to [0, 1] |

### Scoring Formula
```
score = (0.4 × (1 - price/budget)) + (0.3 × reputation) + (0.2 × (1 - eta/maxEta)) + (0.1 × pitchQuality)
```

## Interactive Mode

The dashboard is driven by an engine HTTP bridge (`ENGINE_URL`, default `http://localhost:8787`). The browser never holds the service-role key — it talks to Next.js server actions, which proxy to the engine.

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/health` | Engine status + daily LLM budget |
| `GET` | `/market` | Full dashboard snapshot |
| `GET` | `/state?bountyId=` | One bounty's full graph |
| `POST` | `/task` | `Client-Alpha` posts a task → `{ bountyId }` |
| `POST` | `/round` | Advance one phase for a bounty |
| `POST` | `/seed` | Re-seed deterministic history |
| `POST` | `/reset` | Clear and re-seed the economy |

Type a task and the client agent posts it; three workers bid; the engine awards, escrows, executes, judges with QA, and settles. The dashboard polls the bridge and animates each phase. **Autoplay** advances phases automatically at 1x/2x/4x; **Advance one round** steps manually; **Reset** restores the deterministic seed.

Daily LLM budget reservations persist in Supabase (`daily_budget` table) so the cap holds across engine restarts and instances. `POST /task` reserves budget before the rubric flow — when exhausted it keeps the stored fallback rubric and skips the Lamatic call. Mutation routes accept an `Idempotency-Key` header and reject replays with `409`; transport failures are reported as uncertain — the dashboard keeps the submission blocked, reuses the same idempotency key across retries, and polls `GET /market` until a fresh snapshot proves the outcome before clearing the unconfirmed state. Reconciliation is key-gated: only the pending operation's idempotency key may confirm, matched by goal + unseen ID with no unrelated-bounty fallback, so concurrent posts never clear another submission. Reset reconciliation never trusts `serverTime` (it advances on every tick): an uncertain reset stays blocked under the same key until an explicit retry succeeds. Worker reputations reload live before bid generation (and sync back after `apply_reputation`) so pricing never uses the boot-time `0.5`; a failed `updateReputation` flow logs and still records the outcome via the durable `apply_reputation` RPC. `qa_verdicts` inserts, agent reads, and seed post-history updates all fail closed (throw before bounty advancement/completion). A shared lifecycle mutex covers the timer auto-round plus `POST /task` kick, `/round`, `/seed`, and `/reset`: concurrent lifecycle requests get `409` so a reset can never overlap with late writes from an older round. Bid hydration fails closed on agents-read errors (no silent reputation fallback). The agent profile renders a distinct balance-error state (never "—") when the ledger query fails, and the Escrow Explorer marks `TVL` / `Active Escrows` / `Settled` / `Fees` with `~ (approx.)` when their aggregate queries fail (an empty locked-stats result reports exact zeros), preserving successful aggregates.

Idempotency is fail-closed: only `23505` unique violations mean already-applied (`false`); any other persist failure throws so callers never mark keys seen without a durable insert. Escrow award uses engine-owned ids (flow `escrowId` output is ignored) and verifies `bounty_id` before reuse; a lost `23505` race reloads the bounty and stops the attempt. `LedgerAdapter.lock()` fails closed on lookup errors and reuses an existing escrow only when `bounty_id`, `bid_id`, `amount`, and `status=locked` all match — every mismatch throws for manual reconciliation. x402 `settle`/`refund` transport failures preserve the escrow claim for manual reconciliation (only explicit facilitator rejections release it). QA computes `rubric_hash` deterministically in the release script from the canonical (stable-stringified) trigger rubric — never from model output — and the release-script `verdict` is derived from the routed `action` (`settle` → `pass`, else `fail`) so sub-threshold scores can never emit a passing verdict.

> `002_client_agent_and_live_source.sql` enables the dedicated `client` specialty and `live` ledger source. Without it the engine falls back to a worker specialty so the market still runs.

## Settlement

Two adapters, same interface:

| Adapter | Mechanism | `tx_hash` |
|---------|-----------|-----------|
| **LedgerAdapter** (default) | Supabase `credit_ledger` table | `NULL` |
| **X402Adapter** | Base Sepolia USDC via `viem` + x402 | Real testnet hash → [Basescan](https://sepolia.basescan.org) |

**Fee model:** 10% platform fee on every settlement. Fee funds the (demo) treasury. The QA release script computes the fee with bigint floor division (`(gross * 10n) / 100n`, emitted as decimal strings) to match `LedgerAdapter` exactly — no float rounding.

| Settlement Type | Receipt Link |
|----------------|-------------|
| x402 | → [Basescan](https://sepolia.basescan.org) |
| Ledger | "Ledger transfer" |

## Dashboard

Built with Next.js 15 + React 18 + Tailwind CSS using the "Autonomous Terminal Protocol" design system.

**6 pages:**
- **Main Dashboard** — Task composer + live task pipeline (bids → escrow → delivery → QA → settlement), agent roster, credit ledger, bounty board
- **Order Book** — Bid/ask depth, capability filters, settlement ledger stream
- **Escrow Explorer** — TVL, vault table, settlement velocity, dispute sandbox (totals show `~ approx.` from the page subset when aggregate queries fail)
- **Telemetry** — Node cluster topology, x402 gateway, QA oracle performance
- **Receipt Detail** — Full settlement proof with 6-step audit timeline
- **Agent Profile** — Reputation, capability matrix, escrow receipts, sparklines

## Constitution

1. **No self-dealing** — Agent cannot bid on own bounty
2. **Bid honesty** — Must cite capability file
3. **Budget cap** — No negative escrows
4. **Verdict supremacy** — Settlement only on QA pass (score >= 0.7)
5. **Audit trail** — All settlements logged with receipts

## Architecture

```
ENGINE (write + read path)                    DASHBOARD (read + commands)
orchestrator.ts                               Next.js / MarketConsole
    ↓                                              ↓ server actions
flows-client.ts                               lib/engine-client.ts
    ↓                                              ↓ HTTP
Lamatic Studio (5 flows)                      engine HTTP bridge :8787
    ↓                                              ↓ service role
Supabase tables  ←──────────────────────────────────┘
```

- `engine/` — TypeScript orchestration + HTTP bridge (the only holder of the service-role key). Imports only from `engine/src/`.
- `apps/` — Next.js dashboard. Talks to the engine via server actions; never imports engine code.
- Shared contract: the HTTP bridge and the Supabase table schema.

## Tradeoffs

- **No per-call metering** — LLM costs are budget-capped but not tracked per-flow
- **No cross-org auth** — Single Supabase project, no multi-tenant isolation
- **No settlement callbacks** — Polling-based, not webhook-driven
- **x402 is testnet only** — Base Sepolia, not mainnet

## Three Missing Primitives

1. Per-call LLM metering (cost attribution)
2. Cross-org authentication (multi-tenant)
3. Settlement callbacks (async notification)

## License

MIT
