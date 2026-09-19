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
npm run seed                 # idempotent deterministic history
npm run serve                # HTTP bridge on http://localhost:8787
```

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
| 3 | `execute-task` | Selects winner (reputation-weighted scoring), locks escrow, executes |
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

> `002_client_agent_and_live_source.sql` enables the dedicated `client` specialty and `live` ledger source. Without it the engine falls back to a worker specialty so the market still runs.

## Settlement

Two adapters, same interface:

| Adapter | Mechanism | `tx_hash` |
|---------|-----------|-----------|
| **LedgerAdapter** (default) | Supabase `credit_ledger` table | `NULL` |
| **X402Adapter** | Base Sepolia USDC via `viem` + x402 | Real testnet hash → [Basescan](https://sepolia.basescan.org) |

**Fee model:** 10% platform fee on every settlement. Fee funds the (demo) treasury.

| Settlement Type | Receipt Link |
|----------------|-------------|
| x402 | → [Basescan](https://sepolia.basescan.org) |
| Ledger | "Ledger transfer" |

## Dashboard

Built with Next.js 16 + React 19 + Tailwind CSS using the "Autonomous Terminal Protocol" design system.

**6 pages:**
- **Main Dashboard** — Task composer + live task pipeline (bids → escrow → delivery → QA → settlement), agent roster, credit ledger, bounty board
- **Order Book** — Bid/ask depth, capability filters, settlement ledger stream
- **Escrow Explorer** — TVL, vault table, settlement velocity, dispute sandbox
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

## Testing

```bash
cd engine && npm install && npm test
```

15 tests across 3 files:
- State machine: 4 tests (legal/illegal transitions, revise limit, idempotency)
- Settlement adapters: 4 tests (lock idempotency, settle receipt, x402 lock/settle)
- Golden path: 7 tests (full round, crash recovery, budget governor, flow outputs, dashboard render, constitution)

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
