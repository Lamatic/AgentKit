# SparkTrace

**SparkTrace** is an agentic, **planner-driven** data-pipeline debugging copilot built on [Lamatic.ai](https://lamatic.ai). Give it a production symptom ("yesterday's revenue numbers look low") and, optionally, a pipeline repo. An **Opus planner** runs the investigation — deciding each next step from the evidence gathered so far — delegating to cheaper **Sonnet/Haiku** workers to read the pipeline and write strictly **read-only** diagnostic SQL against your Athena/Glue-cataloged tables, executing it, reading a **compacted** digest of the results, and reasoning toward a grounded, evidence-backed root cause. It never writes to your data. Ever.

Not a "symptom → query" generator. It's an investigator: plan → hypothesize → query → observe → refine → conclude, driven by a central planner, not a fixed script.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsparktrace%2Fapps)

---

## The planner loop

```text
              ┌────────────────────── apps/ (Next.js) ──────────────────────┐
 user ──►     │  UI  ──►  actions/orchestrate.ts  (planner-driven loop)      │
 symptom      │            │                                                  │
 + repo       │   Lamatic flows (LLM, tiered):                               │
              │     planner(Opus) · repo-reader(Sonnet) · query-gen(Sonnet/  │
              │     Haiku) · analyst(Haiku) · reporter(Sonnet)               │
              │   Deterministic libs (no LLM):                               │
              │     safety/query-guard · economy/compactor · aws/* · demo/*  │
              └───────────────────────┬──────────────────────────────────────┘
                        AWS (live: Athena/Glue/S3)  |  alasql (demo fixtures)
```

```text
ingest symptom + repo pointer
  → PipelineIngestor (ingestion layer, no LLM) → PipelineContext
  → loop (≤ stepBudget, default 6):
       planner (Opus) decides nextAction from {symptom, pipeline, evidence[]}:
         "gen_query"  → query-gen → DiagnosticQuery
                        → QUERY GUARD (read-only + no-cross-join + LIMIT + scan cap)   [hard gate]
                        → executor.execute → rows
                        → RESULT COMPACTOR → CompactResult (≤10 rows + stats)
                        → analyst (Haiku) → verdict + append to evidence[]
         "read_repo"  → repo-reader deep-dive → append to pipeline/evidence
         "conclude"   → break
  → reporter (Sonnet) → RootCauseReport
```

The planner re-evaluates after every step — it sees only a compact evidence digest (a hypothesis + one-line finding per prior step, never raw results), and freely chooses each turn to keep testing the current hypothesis, pivot to reading more of the repo, or stop and report. `live` vs `demo` only changes which `QueryExecutor` / `CatalogProvider` / `PipelineIngestor` implementation is injected — the loop logic is identical either way. Every module's contract lives in [`apps/lib/contracts.ts`](apps/lib/contracts.ts).

---

## Five model-tiered agents

| Flow | Role | Model | Why |
|---|---|---|---|
| **`sparktrace-planner`** ⭐ | Decides next action (`gen_query`/`read_repo`/`conclude`) | **Claude Opus 4.8** | Only genuinely hard, stateful reasoning step in the loop |
| **`sparktrace-repo-reader`** | Pipeline repo → DAG, tables, join semantics | **Claude Sonnet 5** | Reads a lot of code |
| **`sparktrace-query-gen`** | Hypothesis + schema → one read-only diagnostic query | **Claude Sonnet 5**, drops to **Claude Haiku 4.5** on simple cases | Well-scoped generation; cheap tier suffices for simple checks |
| **`sparktrace-analyst`** | Compacted result → verdict | **Claude Haiku 4.5** | Payload is tiny by construction (see compactor below) — cheapest tier fits |
| **`sparktrace-reporter`** | Confirmed evidence → root-cause report | **Claude Sonnet 5** | Runs once; user-facing synthesis quality matters |

---

## Safety + economy: two deterministic gates

SparkTrace is safe to point at real production data and cheap to run because two **non-LLM** layers sit between every model call — they hold regardless of prompt quality:

1. **Query Safety Guard** (`apps/lib/safety/query-guard.ts`) — read-only-only (`SELECT`/`WITH`/`DESCRIBE`/`SHOW`/`EXPLAIN`, no DDL/DML, no multi-statement, no comment-smuggling); rejects unbounded cross joins; injects a mandatory `LIMIT` if missing; flags `SELECT *` without aggregation on large tables. No code path reaches `executor.execute()` unguarded. In live mode, the Athena workgroup's `bytesScannedCutoffPerQuery` is a server-side backstop behind it.
2. **Result Compactor** (`apps/lib/economy/compactor.ts`) — only **≤10 sample rows** (head+tail) plus deterministic summary stats (row count, per-column min/max/avg/nulls, distinct counts, date-range span) ever reach a model. The analyst and planner never see raw `QueryExecutionResult.rows`. This is why the analyst runs on Haiku — it's reasoning over a few hundred tokens, not a table dump.

Together with a **step budget** (default 6 planner iterations) and evidence-digest-only planner context, a full investigation is shaped like a handful of Opus decisions plus several cheap Sonnet/Haiku calls over tiny payloads — not a dozen full-table Opus calls.

---

## Two run modes

| | Demo | Live |
|---|---|---|
| **AWS account** | Not needed | Required |
| **Lamatic account** | Not needed — a deterministic demo-reasoner stands in for all five flows | Required — 5 deployed, model-tiered flows |
| **Data source** | Bundled sample pipeline + fixture tables in `assets/sample-scenario/`, executed for real via **alasql** | Your Athena/Glue-cataloged tables, executed via AWS Athena (read-only workgroup) |
| **Use case** | Try the product, CI, grading, offline dev | Real incident investigation |

Demo mode is not a canned transcript — the generated SQL genuinely executes against the bundled fixtures via alasql, and the demo-reasoner drives a real planner loop (decisions, hypotheses, guard, compactor, verdicts); only the LLM and data-source backends are swapped for deterministic/offline stand-ins.

---

## Sample scenario walkthrough

The bundled demo scenario is a small daily revenue-aggregation pipeline with a **planted bug**: an inner join silently drops late-arriving `dim_customer` rows, undercounting revenue for the affected day. Running SparkTrace against it with the symptom *"yesterday's revenue total looks about 15% too low"* walks through:

1. **Ingestion** — the `PipelineIngestor` parses the sample PySpark/SQL repo into a `PipelineContext` — files, roles, tables, and a rough DAG (source events, `dim_customer`, the join, the sink aggregate). This is deterministic: no LLM runs here. The repo-reader (Sonnet) only enters later, if the planner asks for a focused deep-dive.
2. **Planning** — the planner (Opus) opens with `read_repo` or goes straight to `gen_query` against a `late-arriving` hypothesis, prioritized from the pipeline's inner-join shape.
3. **Investigating** — query-gen (Sonnet/Haiku) writes a read-only query comparing row counts/join keys between `fact_events` and the sink around the affected partition; the guard passes it (read-only, has a `LIMIT`, real join predicate); it executes against the alasql fixtures; the compactor reduces the result to ≤10 rows + stats; the analyst (Haiku) confirms the hypothesis from the compacted evidence (fewer joined rows than source rows for late-arriving keys); the planner reads the evidence digest and decides `conclude`.
4. **Reporting** — the reporter (Sonnet) names the inner join as the cause, states confidence, lists the evidence queries, and suggests switching to a left join plus a late-arrival watermark — matching the scenario's ground truth in `assets/sample-scenario/scenario.json`.

---

## Quickstart

```bash
cd apps
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Choose **demo** mode to run the sample scenario with zero configuration, or **live** mode once you've filled in the Lamatic and AWS variables below.

Live mode is off by default — set `SPARKTRACE_ALLOW_LIVE="true"` in `.env.local` to enable it, otherwise the API returns 403 for `mode: "live"`.

For live mode, first deploy the five flows in Lamatic Studio (Studio → "+ New Flow" → Templates → "SparkTrace"), configure each flow's model per the tier table above, then copy the resulting Flow IDs into `.env.local`.

---

## Environment variables

All variables live in [`apps/.env.example`](apps/.env.example). **None are required for demo mode.**

| Variable | Purpose | Required for |
|---|---|---|
| `RUN_MODE` | `"demo"` or `"live"` — selects which backend implementation is injected. Defaults to `demo` if unset | both |
| `SPARKTRACE_ALLOW_LIVE` | Opt-in switch for live mode. The kit ships without auth, so `POST /api/investigate` rejects `mode: "live"` with **403** unless this is exactly `"true"`. Demo mode always works, unset | live |
| `LAMATIC_API_URL` | Base URL for the Lamatic API | live |
| `LAMATIC_PROJECT_ID` | Lamatic project identifier | live |
| `LAMATIC_API_KEY` | Lamatic API key with permission to invoke deployed flows | live |
| `SPARKTRACE_PLANNER_FLOW_ID` | Flow ID for `sparktrace-planner` (Opus 4.8) | live |
| `SPARKTRACE_REPO_READER_FLOW_ID` | Flow ID for `sparktrace-repo-reader` (Sonnet 5) | live |
| `SPARKTRACE_QUERY_GEN_FLOW_ID` | Flow ID for `sparktrace-query-gen` (Sonnet 5 / Haiku 4.5) | live |
| `SPARKTRACE_ANALYST_FLOW_ID` | Flow ID for `sparktrace-analyst` (Haiku 4.5) | live |
| `SPARKTRACE_REPORTER_FLOW_ID` | Flow ID for `sparktrace-reporter` (Sonnet 5) | live |
| `AWS_ACCESS_KEY_ID` | Static AWS credential for Athena/Glue/S3 clients. Optional — the clients use the default AWS provider chain, so an assumed role (task/instance profile, SSO, shared config) supplies credentials without this | live (optional) |
| `AWS_SECRET_ACCESS_KEY` | Paired with `AWS_ACCESS_KEY_ID`; same optionality | live (optional) |
| `AWS_SESSION_TOKEN` | Optional, for temporary/STS credentials | live (optional) |
| `AWS_REGION` | AWS region for Athena/Glue/S3 | live |
| `ATHENA_WORKGROUP` | Athena workgroup queries run in — **use a read-only-scoped workgroup with a scan-bytes cutoff** | live |
| `ATHENA_OUTPUT_LOCATION` | S3 URI Athena writes query results to | live |
| `GLUE_DATABASE` | Default Glue Data Catalog database SparkTrace inspects | live |

---

## Repo structure

```text
sparktrace/
├── lamatic.config.ts          # kit metadata, 5 tiered flow steps, links
├── agent.md                   # agent identity + capability doc
├── README.md                  # this file
├── flows/                     # sparktrace-planner / -repo-reader / -query-gen / -analyst / -reporter
├── prompts/                   # externalized LLM prompts, per flow/node/role
├── model-configs/             # per-flow model tier (Opus/Sonnet/Haiku)
├── constitutions/default.md   # guardrails, incl. read-only + investigation discipline
├── assets/sample-scenario/    # demo pipeline + fixture data + ground truth
├── infra/                     # optional one-click AWS IaC for live mode (CloudFormation + scripts)
└── apps/                      # the Next.js app
    ├── actions/orchestrate.ts # the planner-driven loop
    ├── lib/
    │   ├── contracts.ts       # shared types — single source of truth
    │   ├── lamatic-client.ts  # Lamatic flow client
    │   ├── aws/               # Athena/Glue/S3 clients (live)
    │   ├── demo/               # alasql executor + demo catalog/ingestor/reasoner (demo)
    │   ├── safety/query-guard.ts
    │   ├── economy/compactor.ts
    │   └── ingest/             # pipeline repo ingestion
    ├── app/ | components/     # UI
    └── .env.example
```

---

## Live deployment (AWS, optional)

Demo mode needs no cloud. To run the *same* investigation against real AWS,
[`infra/`](infra/README.md) ships one-click infrastructure-as-code
(CloudFormation + scripts): it provisions an S3 bucket, the Glue Data Catalog
tables for the scenario, and a dedicated read-only Athena workgroup with a hard
per-query scan cap, then wires the credentials into `apps/.env.local`.

```bash
cd infra && cp .env.example .env   # paste deployer AWS keys (gitignored)
bash bin/up.sh                     # deploy + load data + configure the app
bash bin/down.sh                   # tear it all down
```

Nothing in the stack bills hourly (no EC2/NAT/RDS); Athena is per-query and
capped, so a full run costs a fraction of a cent. See [`infra/README.md`](infra/README.md).

---

## License

MIT License – see [LICENSE](../../LICENSE).
