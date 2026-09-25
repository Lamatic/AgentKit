# SQL Performance Tuner

SQL Performance Tuner is a bounded SQLite experimentation agent. It starts with
a slow read-only query, measures a baseline, and repeatedly decides which
single optimization experiment is worth running next: a query rewrite, a
temporary index, or a conclusion.

Lamatic owns two reasoning responsibilities. The strategist flow
(`SQL_TUNER_STRATEGIST_FLOW_ID`) receives only
derived schema details, query plans, timings, and compact experiment evidence,
then diagnoses the evidence and chooses the next distinct experiment. After the
bounded loop, the reviewer flow (`SQL_TUNER_REVIEWER_FLOW_ID`) explains the
deterministic outcome. Neither flow receives raw database rows or approves its
own claims. The application validates every proposal, runs it against a fresh
database snapshot, verifies result equivalence, benchmarks it, and selects the
measured winner.

The agent's value is adaptive experimentation: the choice after the first
experiment depends on the measured outcome of that experiment. A slower,
invalid, or non-equivalent candidate becomes evidence for the next planner turn,
not a hidden failure.

The first release is intentionally SQLite-only and does not make changes to a
user's database. Indexes are tested only inside disposable in-memory copies.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full runtime, safety, and
evaluation design and [AGENT_CONTRACT.md](./AGENT_CONTRACT.md) for the versioned
Lamatic input/output contract.
