# Result Compactor — notes

`compact(result: QueryExecutionResult): CompactResult` (`apps/lib/economy/compactor.ts`)
is the token-saver: the orchestrator MUST call it on every raw execution result before
that result reaches any model — models only ever see a `CompactResult`, never
`QueryExecutionResult.rows`.

## Sampling

- Up to `MAX_SAMPLE_ROWS` (10, from contracts.ts) rows, **head+tail**: first `ceil(n/2)`
  rows plus the last `floor(n/2)` rows. This matters because diagnostic queries are often
  `ORDER BY order_date`, and the anomaly (e.g. the late-arriving-dimension gap) clusters
  at one end of the result — a plain head-only sample could miss it entirely.
- `truncated: true` whenever `rowCount` exceeds the sample actually returned.

## Stats (`ResultStats`)

Computed once over the **full** row set (not just the sample), per column:

- `type`: `"number" | "string" | "boolean" | "null" | "mixed"`, inferred from observed
  values (mixed types across rows -> `"mixed"`).
- Numeric columns: `min`, `max`, `avg`, `nulls` (null count).
- String columns with no numeric values: a lexical `min`/`max` (useful for date-like or
  id-like columns even when not recognized as an ISO date span).
- `distinct`: distinct-value count, scanning at most `DISTINCT_SCAN_CAP` (5000) rows to
  keep compaction itself bounded-cost.
- `dateSpan`: set on the overall `ResultStats` (not per-column) — the first column whose
  non-null values all match ISO-8601 date/timestamp shape gets its min/max reported as
  `{ column, min, max }`.

## Error passthrough

If `result.error` is set, `compact` returns a `CompactResult` with the same `queryId`,
empty sample/stats, and the `.error` string carried through untouched — no attempt to
compute stats over a failed execution.

## Purity

No imports beyond `../contracts`. No I/O, no randomness, no network calls. Synchronous.
