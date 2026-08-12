# Query Safety Guard — Rules & Test Cases

`apps/lib/safety/query-guard.ts` is the deterministic safety gate described in
[ARCHITECTURE.md §2](../../../../ARCHITECTURE.md). The orchestrator calls
`guardQuery(query)` on every `DiagnosticQuery` the LLM produces and **must refuse to call
`executor.execute()` when `ok` is `false`**, and MUST execute `normalizedSql` (not the raw
`query.sql`) when `ok` is `true`, since the guard may have injected a `LIMIT`. This file
documents the rules in prose; `GUARD_TEST_CASES` (exported from `query-guard.ts`) is the
machine-checkable version — wire it into any test runner with a simple loop:

```ts
import { guardQuery, GUARD_TEST_CASES } from "./query-guard";

for (const tc of GUARD_TEST_CASES) {
  const result = guardQuery({ id: "t", hypothesisId: "h", engine: "athena", sql: tc.input, purpose: "test" });
  assert(result.ok === tc.expectOk, `${tc.name}: expected ok=${tc.expectOk}, got ${result.ok} (${result.violations.join("; ")})`);

  // A vector may also pin the guard's *repair* contract (rule 8), not just its verdict.
  if (tc.expectRewritten !== undefined) {
    assert(result.rewritten === tc.expectRewritten, `${tc.name}: expected rewritten=${tc.expectRewritten}, got ${result.rewritten}`);
  }
  if (tc.expectNormalizedSql !== undefined) {
    assert(result.normalizedSql === tc.expectNormalizedSql, `${tc.name}: expected normalizedSql=${JSON.stringify(tc.expectNormalizedSql)}, got ${JSON.stringify(result.normalizedSql)}`);
  }
}
```

This replaces v1's `query-linter.ts` (deleted). It keeps every rule from the v1 linter
(read-only enforcement) unchanged and adds three execution-COST rules on top, because a
query can be perfectly read-only and still be an expensive or dangerous shape to run
against a real Athena workgroup.

## Read-only rules (inherited from v1, unchanged)

1. **Strip comments first.** `--` line comments and `/* ... */` block comments are
   replaced with a single space *before* any other analysis, so a comment can never
   "reveal" a second statement or a banned keyword.
2. **Mask string/identifier contents.** `'single-quoted strings'` and `"double-quoted
   identifiers"` are masked (character count preserved, content replaced) in a parallel
   buffer used only for statement splitting and keyword scanning. A semicolon or banned
   word that only appears inside a string literal is not treated as real SQL structure.
3. **Reject anything but exactly one statement.** After comment-stripping, the query is
   split on `;` (using the masked buffer). An optional single trailing `;` is allowed.
   More than one non-empty statement is rejected — this stops stacked queries and
   comment-smuggled second statements.
4. **Leading keyword allow-list.** The first token of the (single) statement must be one
   of: `SELECT`, `WITH`, `DESCRIBE`, `DESC`, `SHOW`, `EXPLAIN` (case-insensitive).
5. **Banned-word scan.** The full statement is scanned (as whole words, `\bWORD\b`) for:
   `INSERT UPDATE DELETE MERGE DROP CREATE ALTER TRUNCATE GRANT REVOKE CALL SET UNLOAD
   INTO COPY VACUUM`. (`REPLACE` is not banned — it is a standard read-only string
   scalar function in Athena/Trino/Spark SQL; `CREATE OR REPLACE` is already caught by
   the `CREATE` ban.)

## Cost rules (new in v2)

6. **No Cartesian joins.** `CROSS JOIN` is rejected outright (it is inherently a full
   Cartesian product, regardless of any later `WHERE` filter). Any other `JOIN` /
   `INNER JOIN` / `LEFT [OUTER] JOIN` / `RIGHT [OUTER] JOIN` / `FULL [OUTER] JOIN` must be
   followed by an `ON` or `USING` predicate before the next `JOIN` or the end of the
   statement — a bare `JOIN` with only a later unrelated `WHERE` clause is an implicit
   Cartesian product and is rejected.
7. **Unbounded `SELECT *` is rejected.** A top-level `SELECT *` (or `SELECT t.*`) with
   neither an aggregation/grouping construct (`GROUP BY`, `COUNT`, `SUM`, `AVG`, `MIN`,
   `MAX`, `DISTINCT`, `HAVING`) **nor** an explicit `LIMIT` is refused as an unbounded
   full-column scan. Add a `LIMIT` or aggregate the result instead. (If a `LIMIT` is
   already present the scan is bounded and this rule does not fire; rule 8 below covers
   the case where `LIMIT` is simply missing from a non-`SELECT *` query.)
8. **Missing `LIMIT` is auto-injected, not rejected.** If a row-returning top-level
   statement (`SELECT`/`WITH`) has no `LIMIT` anywhere in it, the guard appends
   ` LIMIT 1000` to the normalized SQL and sets `rewritten: true`. The caller MUST execute
   `normalizedSql`, not the original `query.sql`. `DESCRIBE`/`DESC`/`SHOW`/`EXPLAIN` are
   exempt (they don't return unbounded table rows).

## Output shape

```ts
interface QueryGuardResult {
  ok: boolean;
  violations: string[];       // empty when ok
  normalizedSql?: string;     // present when ok; may include an injected LIMIT
  rewritten?: boolean;        // true when the guard modified the SQL (e.g. injected LIMIT)
}
```

`guardQuery` never throws.

## Accepted examples

```sql
SELECT * FROM sales.orders LIMIT 10;

SELECT order_date, COUNT(*) AS cnt, SUM(amount) AS total
FROM sales.orders GROUP BY order_date;                        -- aggregated, LIMIT injected

SELECT o.order_date, COUNT(*) FROM sales.orders o
LEFT JOIN sales.dim_customer d ON o.customer_id = d.customer_id
WHERE d.customer_id IS NULL GROUP BY o.order_date;             -- proper join predicate

DESCRIBE sales.orders;
SHOW TABLES IN sales;
EXPLAIN SELECT * FROM sales.orders;
```

## Rejected examples

```sql
INSERT INTO sales.orders VALUES (1, 2, 3);                     -- write
DROP TABLE sales.orders;                                       -- DDL
SELECT * FROM sales.orders o CROSS JOIN sales.customers c;     -- cartesian
SELECT o.*, c.* FROM sales.orders o JOIN sales.customers c;    -- join with no ON/USING
SELECT * FROM sales.orders;                                    -- unbounded wide scan
SELECT * FROM sales.orders; DROP TABLE sales.orders;           -- stacked
SELECT * FROM sales.orders /* ; */ -- harmless comment
DROP TABLE sales.orders;                                  -- comment-smuggled write
```

## Known limitations (by design, not a full SQL parser)

- This is a lexical/regex-based scanner, not a full SQL grammar — intentionally strict
  rather than clever. A query that legitimately needs a bare identifier named e.g. `set`
  will be rejected. Acceptable false-positive rate for a safety gate.
- The join-predicate check is a heuristic proximity scan (does an `ON`/`USING` appear
  between this `JOIN` and the next one, or end of statement) rather than full join-tree
  parsing; deeply nested subquery joins are scanned the same way and remain caught
  correctly for the single-statement diagnostic queries this guard is designed for.
- Nested block comments are not specially handled; the first `*/` closes the comment.
- The guard enforces *syntax-level* read-only-ness and *shape-level* cost-safety. It is
  one of two independent layers (ARCHITECTURE.md §2) — the second is Athena being pointed
  at a read-only workgroup/IAM policy in live mode, plus Athena's own scan-bytes limits.
