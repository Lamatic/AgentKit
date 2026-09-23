# SQL Performance Tuner

An agentic SQLite query optimizer that proves its recommendations with real
benchmarks and result-equivalence checks.

## Status

This challenge kit is a working two-flow AgentKit submission. The bounded
SQLite sandbox, safety guards, adaptive strategist loop, reviewer report, tests,
and responsive Next.js interface are implemented. Demo mode runs without
credentials; live mode invokes deployed Lamatic strategist and reviewer flows.

## What it does

1. Load the bundled demo database or a small SQLite upload.
2. Measure the original read-only query and inspect `EXPLAIN QUERY PLAN`.
3. Ask the Lamatic strategist to choose one next experiment.
4. Validate, run, compare, and benchmark that candidate in an isolated copy.
5. Send measured evidence back so later experiments adapt from prior results.
6. Repeat within a fixed budget, then deterministically select the fastest
   proven-equivalent result or honestly report that no improvement was proven.
7. Ask the Lamatic reviewer to explain the measured outcome without changing it.

## Architecture

The full product boundary, contracts, safety model, and acceptance criteria are
documented in [ARCHITECTURE.md](./ARCHITECTURE.md).

The exported Lamatic flows are included in:

- `flows/sql-tuner-strategist.ts`
- `flows/sql-tuner-reviewer.ts`

## Run locally

The app requires Node.js 20.9 or newer.

```bash
cd kits/sql-performance-tuner/apps
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` and run the preloaded query in Demo planner mode.
The demo creates a deterministic in-memory commerce database and needs no
credentials.

Useful commands:

```bash
npm run check:contracts
npm run typecheck -- --incremental false
npm test
npm run build
```

## Live Lamatic agent

Copy the deployed project endpoint, project ID, and API key from Lamatic into
`apps/.env.local`, then set:

```dotenv
SQL_TUNER_ALLOW_LIVE="true"
LAMATIC_API_URL="https://..."
LAMATIC_PROJECT_ID="..."
LAMATIC_API_KEY="..."
SQL_TUNER_STRATEGIST_FLOW_ID="bd9e0cce-22c2-4cfb-9769-a57a6df40e87"
SQL_TUNER_REVIEWER_FLOW_ID="aad3f235-e39c-47f4-a4ae-dd88c4ada1f0"
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

Select **Live Lamatic** in the interface. The strategist diagnoses the current
evidence and chooses one next experiment. Local deterministic code validates,
executes, compares, and benchmarks every candidate. After the bounded loop, the
reviewer explains the measured outcome without changing the selected winner.
Production deployments require Upstash Redis and rate-limit live attempts to
five requests per client address per minute. Local development uses a bounded,
expiring in-process fallback. Vercel request cancellation is enabled for the
tuning route and is forwarded to active Lamatic requests.

`apps/.env.local` is ignored and must never be committed. `apps/.env.example`
contains only empty placeholders.

## Flow responsibilities

- `SQL_TUNER_STRATEGIST_FLOW_ID`: proposes exactly one `create_index`,
  `rewrite_query`, or `conclude` decision from schema, baseline plan, benchmark,
  prior experiment evidence, and remaining budget.
- `SQL_TUNER_REVIEWER_FLOW_ID`: writes the final headline, evidence summary,
  recommendation, limitations, and cited experiment numbers after deterministic
  winner selection.

The strategist can choose what to try. The reviewer can explain what happened.
Neither flow can execute SQL, see raw rows, override a guard rejection, declare
equivalence, invent speedups, or replace the locally selected winner.

## Example

Input:

```sql
SELECT customer_id, SUM(total) AS revenue
FROM orders
WHERE created_at >= '2026-01-01'
GROUP BY customer_id
```

Typical output includes the baseline median runtime, each strategist proposal,
the local observation for that experiment, the measured speedup, and either:

```sql
CREATE INDEX idx_orders_created_at_customer_id_total
ON orders(created_at, customer_id, total);
```

or a clear recommendation to keep the original query when no candidate clears
the `1.10x` threshold.

## Modes and uploads

- Demo mode uses a generated 32,000-row commerce database and a deterministic
  fallback strategist/reviewer.
- Live mode uses the Lamatic project configured by `LAMATIC_API_URL`,
  `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, `SQL_TUNER_STRATEGIST_FLOW_ID`, and
  `SQL_TUNER_REVIEWER_FLOW_ID`.
- SQLite uploads are optional, validated as SQLite 3 files, and capped at 4 MB.
  They are evaluated in memory and not written back.

## Safety boundary

- Accepts a single deterministic `SELECT` or `WITH` statement.
- Rejects recursive CTEs and Cartesian joins because synchronous SQLite work
  cannot be interrupted safely inside a request.
- Tokenizes SQL structure before checking joins, so nested queries and quoted
  text are not interpreted as raw SQL keywords or separators.
- Executes candidates only in fresh in-memory database copies.
- Allows only simple indexes on known tables and columns.
- Compares complete results up to 10,000 rows before benchmarking.
- Runs one warmup and five measured executions, using the median.
- Requires at least a 10% speedup before recommending a change.

## Limitations

This is a bounded SQLite tuner, not a production migration engine. It does not
apply changes to user databases, optimize multi-query workloads, connect to
hosted databases, or prove semantic equivalence for arbitrary SQL. Benchmark
evidence should be confirmed against representative production data before any
schema change is applied elsewhere.

## QA artifacts

- Browser QA notes and screenshots: `docs/qa/browser-qa.md`
- Demo video outline: `docs/demo-video-script.md`
