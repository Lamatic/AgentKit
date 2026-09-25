# SQL Performance Tuner Architecture

## Product definition

SQL Performance Tuner is a bounded experimentation agent for SQLite. Given a
SQLite database and a slow read-only query, it derives the schema, measures a
baseline, inspects the query plan, proposes one optimization at a time, executes
each proposal in an isolated database copy, verifies that the result is
unchanged, and decides what to try next from the accumulated evidence.

The MVP succeeds when it can demonstrate all three properties on a bundled
scenario:

1. The next experiment changes in response to real query-plan and benchmark
   evidence.
2. Unsafe or behavior-changing candidates are rejected deterministically.
3. The final recommendation reports a measured speedup and reproducible SQL.

## MVP boundary

### Included

- SQLite only.
- A bundled demo database and known slow query that work without credentials.
- An optional SQLite database upload capped at 4 MB for user-owned experiments.
- Read-only input queries beginning with `SELECT` or `WITH`.
- Two experiment types: query rewrites and temporary indexes.
- A maximum of five experiments per run.
- Median runtime from one warm-up plus five measured executions.
- Exact result comparison for bounded result sets.
- An experiment timeline, winning candidate, measured speedup, and copyable SQL.
- Demo reasoning for local use and Lamatic-backed strategist/reviewer flows for
  live use.

### Deferred

- PostgreSQL, MySQL, hosted database connections, and production credentials.
- Applying schema changes to a user's database.
- Writes, migrations, materialized views, partitioning, and server tuning.
- Multi-query workload optimization.
- Formal proof of semantic equivalence for arbitrary SQL.

These are follow-up directions, not requirements for the challenge submission.

## System boundary

```text
Next.js UI (bundled demo or uploaded SQLite file + query)
  |
  | POST tuning request
  v
Experiment orchestrator
  |-- Query guard and input limits
  |-- SQLite sandbox factory
  |-- Baseline EXPLAIN + benchmark + result digest
  |
  +--> Lamatic strategist flow <-----------------------+
  |      diagnoses evidence and chooses one action     |
  |                                                    |
  +--> Candidate guard                                 |
  +--> Fresh SQLite sandbox                            |
  +--> Execute + EXPLAIN + benchmark                   |
  +--> Equivalence gate                                |
  +--> Compact experiment evidence --------------------+
  |
  v
Deterministic winner selection -> Lamatic reviewer explanation -> UI evidence trail
```

Lamatic owns decisions. TypeScript owns facts and enforcement. A model may
propose an experiment, but it cannot approve its own safety, equivalence, or
performance claim.

## Agent loop

The orchestrator follows the same loop in demo and live modes:

1. Validate the request, load either the bundled fixture or uploaded database,
   derive its schema, and construct an immutable base snapshot.
2. Run the original query to capture its plan, result digest, and baseline
   benchmark.
3. Send the schema, original query, baseline evidence, experiment history, and
   remaining budget to the planner.
4. Receive exactly one action: `rewrite_query`, `create_index`, or `conclude`.
5. Validate the proposed SQL with deterministic guards.
6. Restore a fresh database from the immutable base snapshot and apply only that
   candidate.
7. Execute the candidate query, compare its complete bounded result with the
   baseline, inspect its plan, and benchmark it.
8. Record accepted, rejected, failed, or slower evidence in compact form.
9. Return to step 3 until the planner concludes or the budget is exhausted.
10. Select the fastest equivalent candidate and build the report from recorded
    measurements.

The planner is invoked after every experiment. There is no fixed sequence such
as "always add an index, then rewrite"; rejected and slower attempts are useful
evidence that can cause the planner to pivot.

## Lamatic flow contracts

The versioned source of truth is [AGENT_CONTRACT.md](./AGENT_CONTRACT.md), with
runtime validation in `apps/lib/contracts.ts`. The runtime uses an adaptive
strategist flow and a final reviewer flow.

The agent has two mandatory Lamatic flows:

- `sql-tuner-strategist` runs an Evidence Analyst followed by an Experiment
  Strategist, which chooses the next experiment or concludes. The application
  invokes the flow once per loop iteration.
- `sql-tuner-reviewer` runs an Evidence Synthesizer followed by a Final Reviewer
  after the application has selected the winner deterministically.

### Input

```ts
interface StrategistInput {
  contractVersion: "1.0";
  originalQuery: string;
  schema: TableSchema[];
  baseline: Baseline;
  experiments: StrategistExperimentEvidence[];
  attemptedStrategies: StrategistStrategy[];
  remainingExperiments: number;
}
```

Only schema metadata, compact plans, timings, and evidence summaries reach the
model. Raw database rows do not.

### Output

```ts
type StrategistDecision =
  | {
      contractVersion: "1.0";
      action: "rewrite_query";
      strategy: "query_rewrite" | "revise_failed_candidate";
      hypothesis: string;
      expectedPlanChange: string;
      sql: string;
      adaptation: Adaptation;
      stopConditions: string[];
    }
  | {
      contractVersion: "1.0";
      action: "create_index";
      strategy: IndexStrategy;
      hypothesis: string;
      expectedPlanChange: string;
      indexSql: string;
      adaptation: Adaptation;
      stopConditions: string[];
    }
  | {
      contractVersion: "1.0";
      action: "conclude";
      strategy: "conclude";
      conclusionCode: ConclusionCode;
      reasoning: string;
      evidenceUsed: number[];
    };
```

The flow returns schema-constrained JSON. The application validates it again at
runtime before using it.

## Deterministic runtime

### SQLite engine

Use `sql.js` in the Next.js Node runtime. It provides a portable SQLite engine,
supports `EXPLAIN QUERY PLAN`, and lets each candidate run against a database
restored from the same exported byte snapshot. The bundled demo data is created
locally, so demo mode requires no database service. Uploaded databases and all
query execution run in disposable worker threads with a hard server-side
deadline, allowing a timed-out query to be terminated instead of blocking the
request process.

### Benchmark protocol

- Run one warm-up execution.
- Run five measured executions.
- Use the median, not the fastest run.
- Run baseline and every candidate against equivalent fresh snapshots.
- Report both milliseconds and `baselineMedian / candidateMedian` speedup.
- Treat improvements below 10 percent as noise and do not recommend them as a
  win.

The UI will label these numbers as local sandbox measurements, not production
latency predictions.

### Equivalence protocol

- Reject queries with nondeterministic functions used by the demo engine.
- Execute the full result up to a fixed maximum of 10,000 rows.
- Canonicalize values and compare row hashes.
- Preserve row order when the original query has `ORDER BY`; otherwise compare
  rows as a multiset.
- Reject candidates with a different column list, row count, or result hash.
- Mark results above the cap as unverifiable and therefore ineligible to win.

This is execution-based validation for bounded inputs, not a universal proof of
SQL equivalence. The product states that limitation explicitly.

## Safety model

All SQL is untrusted, including model output.

- Original and rewritten queries must be one `SELECT` or `WITH` statement.
- Index candidates must be one `CREATE INDEX` statement targeting an existing
  table and existing columns.
- Reject comments, multiple statements, DML, dangerous pragmas, attachments,
  extension loading, and schema changes other than the isolated temporary
  index.
- Reject recursive CTEs, Cartesian joins, and nondeterministic functions.
- Limit uploaded databases and serialized result evidence to 4 MB, and also
  limit result rows, query length, experiment count, and request duration.
- Reject unbounded result-expansion functions before execution, then enforce
  byte limits while inspecting and benchmarking results inside a memory-limited
  worker.
- Run every candidate in a fresh in-memory database; never mutate the base
  snapshot.
- Keep Lamatic credentials server-side. Public live requests require a separate
  distributed rate limiter and are rate-limited per client address.

The guard combines conservative statement normalization, explicit token and
operation allowlists, identifier validation against derived schema metadata,
and SQLite preparation in an isolated database. Unsupported or ambiguous SQL
is rejected rather than repaired automatically.

## Application modules

```text
kits/sql-performance-tuner/
  lamatic.config.ts
  agent.md
  README.md
  ARCHITECTURE.md
  constitutions/default.md
  flows/sql-tuner-strategist.ts
  flows/sql-tuner-reviewer.ts
  prompts/
  model-configs/
  docs/qa/browser-qa.md
  docs/demo-video-script.md
  apps/
    app/api/tune/route.ts
    app/page.tsx
    lib/contracts.ts
    lib/demo-database.ts
    lib/planner.ts
    lib/rate-limit.ts
    lib/request-body.ts
    lib/sql-safety.ts
    lib/sql-worker.cjs
    lib/sql-worker.ts
    lib/sqlite-engine.ts
    lib/tuner.ts
    scripts/check-contracts.mjs
    scripts/run-tests.cjs
    vercel.json
```

`contracts.ts` is the single source of truth across the orchestrator, planner,
runtime, API, and UI.

## UI contract

The first screen is the working tuner, not a landing page. It contains:

- A demo/live mode control.
- A bundled-demo selector or SQLite file input, plus a derived schema summary
  and editable SQL input.
- Run and Stop request controls. Stopping aborts the browser request and the
  active Lamatic network call and terminates the active SQLite worker.
- Baseline plan and timing.
- A chronological experiment trail distinguishing Lamatic strategist decisions,
  deterministic local measurements, and plan/timing verdicts.
- A Lamatic reviewer section showing headline, evidence summary, recommendation,
  limitations, cited experiments, and the exact winning SQL or original query.
- Empty, running, success, no-improvement, invalid-query, and failure states.

## Failure behavior

- A strategist timeout or malformed response consumes no experiment and may be
  retried once.
- Guard rejection becomes evidence for the next strategist turn.
- SQL execution errors become evidence; they do not crash the run.
- A non-equivalent candidate is permanently ineligible and the strategist is told
  why.
- If every candidate fails or is slower, the correct result is "no proven
  improvement," with the attempted experiments still visible.
- Budget exhaustion forces deterministic selection and reporting.

## Why this is an agent

A workflow would execute a predetermined optimization checklist. This system
does not know its second experiment before seeing the first experiment's plan,
timing, and equivalence result. The Lamatic strategist can abandon a rewrite, try a
different index, or stop early based on measured evidence. Its actions change
the environment, and observations from that changed environment determine the
next action.

## Acceptance criteria

- The bundled scenario completes without external credentials.
- Live mode invokes the deployed Lamatic strategist at least twice on the bundled
  scenario unless it finds and proves a winner early.
- Rejected, slower, and non-equivalent candidates remain visible as evidence and
  are supplied to the live strategist before its next decision.
- No model-authored performance number appears in the report.
- A candidate cannot win without passing the guard and equivalence gate.
- The app reports "no proven improvement" honestly when appropriate.
- Unit tests cover first proposals, adaptive evidence, budget exhaustion,
  duplicate detection, guards, equivalence rejection, reviewer normalization,
  reviewer contradiction rejection, invalid input, demo reports, and winner
  threshold selection.
