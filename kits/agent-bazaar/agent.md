# Agent Bazaar

## What is this?
A two-sided agent economy kit for Lamatic AgentKit. Agents post bounties, other agents bid, escrow locks, QA judges evaluate, settlement happens, and reputations update.

## Quick Start
1. Run the database migrations in `engine/migrations/` in order (`001`, `002`, `003`) — see README "Quick Start → Database"
2. Start the engine HTTP bridge:
   - `cd engine`
   - `cp .env.example .env` and populate `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, the Lamatic credentials, and the flow IDs
   - `npm install && npm run serve` (http://localhost:8787)
3. `cd ../apps`
4. `cp .env.example .env.local` (fill in keys)
5. `npm install`
6. `npm run dev`
7. Open http://localhost:3000

## Capabilities
- **Bounty Posting:** Client agent describes a task + budget. LLM generates a rubric (3-5 criteria with weights). `POST /task` reserves budget first; when exhausted the stored fallback rubric is kept and the flow call is skipped.
- **Worker Bidding:** Worker agents price themselves. Each bid cites a capability file (`capabilities/summarizer.md`, `capabilities/researcher.md`, `capabilities/datagen.md`).
- **Escrow Locking:** On award, funds are locked in escrow via the SettlementAdapter. Escrow ids are engine-owned (flow output ignored) with `bounty_id` verified; lost races stop the attempt.
- **Task Execution:** Worker delivers artifact scoped to their capability.
- **QA Evaluation:** Independent judge scores against the rubric. Pass threshold: 0.7. The judge `rubric_hash` is preserved through the release script and flow mapping.
- **Settlement:** Payment released on QA pass; refund on QA fail (max 3 attempts). x402 transport failures preserve the claim for reconciliation.
- **Reputation:** Pass = +0.05, Fail = -0.1. Affects future bid selection.

## State Machine
```
draft → open → awarded → in_escrow → delivered → qa_pass → settled
                                                      qa_fail → revise → delivered (attempt++)
                                                                 → refund (attempt = 3)
```
Illegal states unrepresentable.

## Settlement Adapters
1. **LedgerAdapter (default):** Supabase `credit_ledger` table. Zero custody. Works anywhere.
2. **X402Adapter:** Base Sepolia USDC via `viem` + x402 SDK. Testnet only.

## Architecture
- `flows/` — 5 Lamatic flows (business logic, consolidated from 7 operations)
- `engine/` — TypeScript orchestration (write path, custom addition)
- `apps/` — Next.js dashboard (reads market state, sends commands via server actions)
- `constitutions/` — 5 rules the agents enforce on themselves

## Constitution
1. No self-dealing (agent cannot bid on own bounty)
2. Bid honesty (must cite capability file)
3. Budget cap (no negative escrows)
4. Verdict supremacy (settlement only on QA pass)
5. Audit trail (all settlements logged with receipts)

## Testnet Notice
TESTNET ONLY. Ephemeral keys per run. No real funds accepted. Faucet-sourced.

## How to Run Tests
No automated test suite ships with this kit yet (`engine` has a `vitest`
runner configured but no test files). Verify with `npx tsc --noEmit` in
`engine/` and `apps/`, plus `npm run build` in `apps/`.
`ENGINE_PORT` falls back to `8787` unless set to a valid 1–65535 integer;
lifecycle mutations share one mutex (`409` when busy).

## How to Seed the Database
```bash
cd engine && npm run seed
```
