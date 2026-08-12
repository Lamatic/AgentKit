# Result Compactor — notes

`compact(result: QueryExecutionResult): CompactResult` (`apps/lib/economy/compactor.ts`)
is the token-saver: the orchestrator MUST call it on every raw execution result before
that result reaches the analyst — the analyst only ever sees a `CompactResult`, never
`QueryExecutionResult.rows`.

The reporter is handed the whole `Investigation` (which retains each step's raw
`execution`, kept for the record/UI) rather than individual `CompactResult`s, so the
"models never see raw rows" guarantee for that flow is enforced one level up: 
`lamatic-client.ts`'s `toModelSafeInvestigation()` strips every `steps[].execution`
(and trims `pipeline.files[].content`) before the payload is sent to the reporter flow.

## Sampling

- Up to `MAX_SAMPLE_ROWS` (10, from contracts.ts) rows, **head+tail**: first `ceil(n/2)`
  rows plus the last `floor(n/2)` rows. This matters because diagnostic queries are often
  `ORDER BY order_date`, and the anomaly (e.g. the late-arriving-dimension gap) clusters
  at one end of the result — a plain head-only sample could miss it entirely.
- `truncated: true` when the executor already truncated the result (both the Athena and
  demo executors cap rows at `MAX_ROWS` before `compact()` runs and set `truncated`
  themselves) **or** when `rowCount` exceeds the sample actually returned.

## Stats (`ResultStats`)

Computed once over the **full** row set (not just the sample), per column:

- `type`: `"number" | "string" | "boolean" | "null" | "mixed"`, inferred from observed
  values (mixed types across rows -> `"mixed"`).
- Numeric columns: `min`, `max`, `avg`, `nulls` (null count).
- String columns with no numeric values: a lexical `min`/`max` (useful for date-like or
  id-like columns even when not recognized as an ISO date span).
- `distinct`: distinct-value count, scanning at most `DISTINCT_SCAN_CAP` (5000) rows to
  keep compaction itself bounded-cost. When that cap is hit, `distinctCapped: true` is set
  and `distinct` is a lower bound, not an exact count. (The caveat lives on its own field
  — `type` stays a plain value-type label.)
- `dateSpan`: set on the overall `ResultStats` (not per-column) — the first column whose
  non-null values all match ISO-8601 date/timestamp shape gets its min/max reported as
  `{ column, min, max }`.

## Error passthrough

If `result.error` is set, `compact` returns a `CompactResult` with the same `queryId`,
empty sample/stats, and the `.error` string carried through untouched — no attempt to
compute stats over a failed execution.

## Purity

No imports beyond `../contracts`. No I/O, no randomness, no network calls. Synchronous.
