/**
 * SparkTrace — Query Safety Guard (v2)
 * ------------------------------------------------------------------
 * THE core safety gate. Pure function, zero external dependencies, NO
 * network/API calls. The orchestrator MUST call `guardQuery` on every
 * LLM-generated `DiagnosticQuery` and refuse to call `executor.execute()`
 * when the result is `ok: false`. See ARCHITECTURE.md §2 (safety model).
 *
 * This replaces v1's `query-linter.ts`. It keeps v1's read-only
 * enforcement pipeline verbatim (comment-stripping / string-masking /
 * single-statement / leading-keyword allowlist / banned-word scan) and
 * adds execution-COST rules on top, since a read-only query can still be
 * an expensive/dangerous one to run against a real Athena workgroup:
 *
 *   a. Cartesian products are rejected: any `JOIN` (or `CROSS JOIN`)
 *      without a corresponding `ON`/`USING` predicate is refused.
 *   b. Unbounded result sets are repaired, not rejected: a top-level
 *      query with no `LIMIT` clause gets `LIMIT 1000` injected, and the
 *      result is returned with `rewritten: true` and the modified SQL in
 *      `normalizedSql`.
 *   c. `SELECT *` is rejected when it has NEITHER an aggregation
 *      construct (`GROUP BY`/`COUNT`/`SUM`/`AVG`/`MIN`/`MAX`/`DISTINCT`/
 *      `HAVING`) NOR an explicit `LIMIT` — that shape is an unbounded
 *      full-column scan. If either is present, `SELECT *` is allowed.
 *      This check runs before the LIMIT-injection in (b), so an
 *      unaggregated `SELECT *` is never auto-repaired by an injected
 *      LIMIT — see `isUnaggregatedSelectStar` below for the exact rule.
 *
 * Strategy (defense in depth against a single-purpose parser, not a
 * full SQL grammar) for the base read-only pass:
 *   1. Strip comments (`--` line comments and block comments) BEFORE
 *      doing anything else, so a comment can never be used to smuggle a
 *      second statement or hide a banned keyword that later gets
 *      "revealed" by a naive scanner.
 *   2. While stripping comments, also mask the *contents* of string
 *      literals (`'...'`) and quoted identifiers (`"..."`) so that
 *      (a) semicolons inside a string don't get mistaken for a
 *      statement separator, and (b) words inside a string don't
 *      false-positive trigger the banned-keyword scan.
 *   3. Split on `;` (ignoring a single optional trailing `;`) and
 *      reject anything that isn't exactly one non-empty statement —
 *      this is what defeats stacked queries.
 *   4. Require the statement's leading keyword to be one of
 *      SELECT / WITH / DESCRIBE / DESC / SHOW / EXPLAIN.
 *   5. Reject if any banned write/DDL/DML/admin keyword appears
 *      anywhere in the statement as a whole word.
 */

import type { DiagnosticQuery, QueryGuardResult } from "../contracts";

/** Leading keywords that make a statement read-only in Athena/Presto/Spark SQL. */
const ALLOWED_LEADING_KEYWORDS = new Set([
  "SELECT",
  "WITH",
  "DESCRIBE",
  "DESC",
  "SHOW",
  "EXPLAIN",
]);

/**
 * `EXPLAIN ANALYZE` (any amount of whitespace between the two words) is
 * NOT a read-only/no-cost statement: unlike plain `EXPLAIN`, it actually
 * executes the query and scans data in both Athena and Trino, so it must
 * be rejected even though its leading keyword is the allowed `EXPLAIN`.
 */
const EXPLAIN_ANALYZE_RE = /^EXPLAIN\s+ANALYZE\b/i;

/**
 * Words that, anywhere in the statement, indicate a write, DDL, DML,
 * or administrative operation. Checked as whole words (via `\b`) so
 * `created_at` doesn't trigger on `CREATE`, etc.
 *
 * `INTO` is banned outright: legitimate read-only Athena/Presto SQL
 * never needs a bare `INTO` token (there's no `SELECT ... INTO` /
 * `INSERT INTO` use that is read-only); `INSERT INTO` is additionally
 * covered by `INSERT` alone.
 */
const BANNED_WORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "DROP",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "CALL",
  "SET",
  "UNLOAD",
  "INTO",
  "COPY",
  "VACUUM",
];

const BANNED_WORD_RE = new RegExp(`\\b(${BANNED_WORDS.join("|")})\\b`, "i");

/** Aggregate/grouping constructs that make a wide `SELECT *` acceptable
 * (the result set is bounded by the grouping, not by row count alone). */
const AGGREGATION_RE =
  /\b(GROUP\s+BY|COUNT|SUM|AVG|MIN|MAX|DISTINCT|HAVING)\s*\(?/i;

const LIMIT_RE = /\bLIMIT\s+\d+/i;
const CROSS_JOIN_RE = /\bCROSS\s+JOIN\b/i;
/** Matches any `[INNER|LEFT|RIGHT|FULL] [OUTER] JOIN` (but not CROSS JOIN,
 * handled separately since it never takes ON/USING). */
const JOIN_RE =
  /\b(?:INNER\s+JOIN|(?:LEFT|RIGHT|FULL)\s+(?:OUTER\s+)?JOIN|JOIN)\b/gi;

const DEFAULT_INJECTED_LIMIT = 1000;

interface StripResult {
  /** Comments removed (replaced with a single space); strings/identifiers left intact. Used for normalizedSql. */
  cleaned: string;
  /** Same as `cleaned` but string/identifier contents are masked with `x`. Used for statement-splitting and keyword scanning so quoted text can't smuggle `;` or banned words. Always the same length as `cleaned`. */
  masked: string;
}

/**
 * Strips `--` and `/* *\/` comments and masks the contents of
 * `'...'` string literals and `"..."` quoted identifiers.
 * Handles doubled-quote escaping (`''`, `""`).
 */
function stripCommentsAndMaskStrings(sql: string): StripResult {
  let cleaned = "";
  let masked = "";
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const c = sql[i];
    const c2 = i + 1 < n ? sql[i + 1] : "";

    // Line comment: -- ... \n
    if (c === "-" && c2 === "-") {
      cleaned += " ";
      masked += " ";
      i += 2;
      while (i < n && sql[i] !== "\n") i++;
      continue;
    }

    // Block comment: /* ... */
    if (c === "/" && c2 === "*") {
      cleaned += " ";
      masked += " ";
      i += 2;
      while (i < n && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i += 2; // skip closing */ (safe even if unterminated -> i overshoots, loop ends)
      continue;
    }

    // Single-quoted string literal
    if (c === "'") {
      cleaned += c;
      masked += "x";
      i++;
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          cleaned += "''";
          masked += "xx";
          i += 2;
          continue;
        }
        if (sql[i] === "'") {
          cleaned += "'";
          masked += "x";
          i++;
          break;
        }
        cleaned += sql[i];
        masked += "x";
        i++;
      }
      continue;
    }

    // Double-quoted identifier
    if (c === '"') {
      cleaned += c;
      masked += "x";
      i++;
      while (i < n) {
        if (sql[i] === '"' && sql[i + 1] === '"') {
          cleaned += '""';
          masked += "xx";
          i += 2;
          continue;
        }
        if (sql[i] === '"') {
          cleaned += '"';
          masked += "x";
          i++;
          break;
        }
        cleaned += sql[i];
        masked += "x";
        i++;
      }
      continue;
    }

    cleaned += c;
    masked += c;
    i++;
  }

  return { cleaned, masked };
}

/**
 * Splits comment-stripped SQL into individual statements using the
 * masked text to find real (non-string, non-comment) `;` separators.
 * `cleaned` and `masked` must be the same length (guaranteed by
 * `stripCommentsAndMaskStrings`).
 */
function splitStatements(cleaned: string, masked: string): string[] {
  const parts: string[] = [];
  let last = 0;
  for (let idx = 0; idx < masked.length; idx++) {
    if (masked[idx] === ";") {
      parts.push(cleaned.slice(last, idx));
      last = idx + 1;
    }
  }
  parts.push(cleaned.slice(last));
  return parts;
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Checks each `JOIN` in the (masked) statement for a following `ON` or
 * `USING` predicate before the next `JOIN`/end-of-statement. Also
 * rejects `CROSS JOIN` outright (a cross join is inherently a full
 * Cartesian product regardless of any later WHERE filter).
 */
function checkJoinPredicates(masked: string): string[] {
  const violations: string[] = [];

  if (CROSS_JOIN_RE.test(masked)) {
    violations.push("Statement uses CROSS JOIN, which produces a Cartesian product — not allowed.");
  }

  // Find every non-CROSS JOIN occurrence and verify an ON/USING appears
  // before the next JOIN keyword (or end of statement).
  const joinMatches = [...masked.matchAll(JOIN_RE)];
  for (let idx = 0; idx < joinMatches.length; idx++) {
    const match = joinMatches[idx];
    const start = match.index ?? 0;
    // Skip if this match is actually the JOIN half of "CROSS JOIN" —
    // already reported above and CROSS JOIN never needs ON/USING.
    const precedingText = masked.slice(Math.max(0, start - 10), start);
    if (/CROSS\s+$/i.test(precedingText)) continue;

    const segmentEnd =
      idx + 1 < joinMatches.length ? (joinMatches[idx + 1].index ?? masked.length) : masked.length;
    const segment = masked.slice(start, segmentEnd);
    if (!/\b(ON|USING)\b/i.test(segment)) {
      violations.push(
        `JOIN at position ${start} has no ON/USING predicate — implicit Cartesian products are not allowed.`
      );
    }
  }

  return violations;
}

/**
 * True when the statement is a top-level `SELECT *` (or `SELECT alias.*`
 * / `SELECT t1.*, t2.*`) with no aggregation/grouping construct — i.e.
 * an unbounded wide-column pull.
 */
function isUnaggregatedSelectStar(masked: string): boolean {
  const selectStarRe = /^\s*SELECT\s+(?:[\w]+\.)?\*/i;
  if (!selectStarRe.test(masked)) return false;
  return !AGGREGATION_RE.test(masked);
}

/**
 * Injects `LIMIT <n>` onto a statement that has none. Applied to the
 * *cleaned* (unmasked) SQL so the literal text returned to the caller is
 * readable; safe because we only ever append, never rewrite existing
 * text.
 */
function injectLimit(cleanedStatement: string, limit: number): string {
  const trimmed = cleanedStatement.trim();
  return `${trimmed} LIMIT ${limit}`;
}

/**
 * Guards a diagnostic query for read-only safety AND execution cost.
 * Never throws. Returns `{ ok: false, violations: [...] }` for anything
 * that isn't a single, unambiguous, read-only, cost-safe
 * SELECT/WITH/DESCRIBE/SHOW/EXPLAIN statement.
 */
export function guardQuery(query: DiagnosticQuery): QueryGuardResult {
  const violations: string[] = [];
  const rawSql = query?.sql ?? "";

  if (typeof rawSql !== "string" || rawSql.trim().length === 0) {
    return { ok: false, violations: ["Query SQL is empty."] };
  }

  const { cleaned, masked } = stripCommentsAndMaskStrings(rawSql);

  const cleanedStatements = splitStatements(cleaned, masked);
  const maskedStatements = splitStatements(masked, masked);

  // Drop trailing empty statement produced by an optional trailing ';'.
  const nonEmpty: Array<{ cleaned: string; masked: string }> = [];
  for (let idx = 0; idx < cleanedStatements.length; idx++) {
    const c = cleanedStatements[idx];
    const m = maskedStatements[idx];
    if (m.trim().length > 0) {
      nonEmpty.push({ cleaned: c, masked: m });
    }
  }

  if (nonEmpty.length === 0) {
    return { ok: false, violations: ["Query contains no executable statement (only comments/whitespace)."] };
  }

  if (nonEmpty.length > 1) {
    violations.push(
      `Query must contain exactly one statement; found ${nonEmpty.length} (multi-statement / stacked queries are not allowed).`
    );
  }

  // Lint the first statement in detail (and any extras, so violations are informative).
  for (const stmt of nonEmpty) {
    const trimmedMasked = stmt.masked.trim();
    const leadingMatch = /^([A-Za-z]+)/.exec(trimmedMasked);
    const leadingKeyword = leadingMatch ? leadingMatch[1].toUpperCase() : "";

    if (!leadingKeyword || !ALLOWED_LEADING_KEYWORDS.has(leadingKeyword)) {
      violations.push(
        `Statement must start with one of SELECT, WITH, DESCRIBE, DESC, SHOW, EXPLAIN (found "${leadingKeyword || "<none>"}").`
      );
    } else if (leadingKeyword === "EXPLAIN" && EXPLAIN_ANALYZE_RE.test(trimmedMasked)) {
      violations.push(
        `"EXPLAIN ANALYZE" actually executes the statement and scans data (Athena/Trino), violating the read-only/cost-safety contract — only non-executing EXPLAIN is allowed.`
      );
    }

    const bannedMatch = BANNED_WORD_RE.exec(stmt.masked);
    if (bannedMatch) {
      violations.push(`Statement contains disallowed keyword "${bannedMatch[1].toUpperCase()}" — only read-only queries are permitted.`);
    }

    // Cost rule (a): reject Cartesian joins.
    violations.push(...checkJoinPredicates(stmt.masked));
  }

  if (violations.length > 0) {
    return { ok: false, violations };
  }

  // From here on the statement is read-only and join-safe. Apply the
  // remaining cost rules to the primary (first) statement only.
  const primary = nonEmpty[0];
  let normalizedCleaned = collapseWhitespace(primary.cleaned);
  const normalizedMasked = collapseWhitespace(primary.masked);
  let rewritten = false;

  // Cost rule (c): SELECT * with no aggregation and no LIMIT is an
  // unbounded wide scan — reject rather than silently narrow the
  // columns the caller asked for.
  if (isUnaggregatedSelectStar(normalizedMasked) && !LIMIT_RE.test(normalizedMasked)) {
    violations.push(
      "SELECT * without any aggregation (GROUP BY/COUNT/SUM/AVG/MIN/MAX/DISTINCT) and without a LIMIT is an unbounded full-column scan — add a LIMIT or aggregate the result."
    );
    return { ok: false, violations };
  }

  // Cost rule (b): inject LIMIT when the top-level query has none.
  // Only applies to row-returning statements (SELECT/WITH); DESCRIBE/
  // DESC/SHOW/EXPLAIN either return a small fixed metadata set or (for
  // EXPLAIN) a plan, not table rows, so LIMIT is not meaningful there.
  // (CTEs' own inner SELECTs are exempt — only the top-level statement's
  // absence of a LIMIT anywhere in the whole statement matters, since a
  // LIMIT deep in a CTE doesn't bound the final result set. We check the
  // whole normalized statement for simplicity/conservativeness: any
  // LIMIT token is treated as bounding.)
  const leadingKeyword = (/^([A-Za-z]+)/.exec(normalizedMasked)?.[1] ?? "").toUpperCase();
  const isRowReturning = leadingKeyword === "SELECT" || leadingKeyword === "WITH";
  if (isRowReturning && !LIMIT_RE.test(normalizedMasked)) {
    normalizedCleaned = injectLimit(normalizedCleaned, DEFAULT_INJECTED_LIMIT);
    rewritten = true;
  }

  return {
    ok: true,
    violations: [],
    normalizedSql: normalizedCleaned,
    rewritten,
  };
}

// ─────────────────────────────────────────────────────────────
// Unit-test cases (consumed by any test runner; see
// query-guard.test-cases.md for the human-readable rulebook).
// ─────────────────────────────────────────────────────────────

export interface GuardTestCase {
  name: string;
  input: string;
  expectOk: boolean;
  /**
   * Expected `rewritten` flag. Asserted only when present — pins whether
   * the guard DID or DID NOT rewrite, so a silently-broken LIMIT injection
   * can't pass just because `ok` is still true (rule 8 requires the caller
   * to execute `normalizedSql`).
   */
  expectRewritten?: boolean;
  /** Exact expected `normalizedSql` (whitespace-collapsed, LIMIT injected). */
  expectNormalizedSql?: string;
}

export const GUARD_TEST_CASES: GuardTestCase[] = [
  {
    name: "plain select is ok",
    input: "SELECT order_id, amount FROM sales.orders WHERE amount > 100 LIMIT 50",
    expectOk: true,
  },
  {
    name: "write is rejected",
    input: "INSERT INTO sales.orders VALUES (1, 2, 3)",
    expectOk: false,
  },
  {
    name: "cross join without ON is rejected",
    input: "SELECT * FROM sales.orders o CROSS JOIN sales.customers c LIMIT 10",
    expectOk: false,
  },
  {
    name: "join without ON/USING predicate is rejected (implicit cartesian)",
    input: "SELECT o.order_id, c.customer_name FROM sales.orders o JOIN sales.customers c LIMIT 10",
    expectOk: false,
  },
  {
    name: "missing LIMIT is auto-injected",
    input: "SELECT order_id, amount FROM sales.orders WHERE amount > 100",
    expectOk: true,
    expectRewritten: true,
    expectNormalizedSql:
      "SELECT order_id, amount FROM sales.orders WHERE amount > 100 LIMIT 1000",
  },
  {
    name: "explicit LIMIT is left untouched (no second LIMIT injected)",
    input: "SELECT order_id, amount FROM sales.orders WHERE amount > 100 LIMIT 50",
    expectOk: true,
    expectRewritten: false,
    expectNormalizedSql:
      "SELECT order_id, amount FROM sales.orders WHERE amount > 100 LIMIT 50",
  },
  {
    name: "comment-smuggled write is rejected",
    input: "SELECT * FROM sales.orders /* ; */ -- \nDROP TABLE sales.orders",
    expectOk: false,
  },
  {
    name: "aggregated query is ok",
    input: "SELECT order_date, COUNT(*) AS cnt, SUM(amount) AS total FROM sales.orders GROUP BY order_date",
    expectOk: true,
  },
  {
    name: "join with explicit ON predicate is ok",
    input:
      "SELECT o.order_date, COUNT(*) AS dropped_orders FROM sales.orders o LEFT JOIN sales.dim_customer d ON o.customer_id = d.customer_id WHERE d.customer_id IS NULL GROUP BY o.order_date",
    expectOk: true,
  },
  {
    name: "join with USING predicate is ok",
    input: "SELECT o.order_date, COUNT(*) FROM sales.orders o JOIN sales.dim_customer d USING (customer_id) GROUP BY o.order_date",
    expectOk: true,
  },
  {
    name: "select star with no aggregation and no limit is rejected",
    input: "SELECT * FROM sales.orders",
    expectOk: false,
  },
  {
    name: "select star with explicit limit is ok (bounded scan)",
    input: "SELECT * FROM sales.orders LIMIT 25",
    expectOk: true,
  },
  {
    name: "stacked queries via semicolon rejected",
    input: "SELECT * FROM sales.orders LIMIT 1; DROP TABLE sales.orders",
    expectOk: false,
  },
  {
    name: "describe table is ok",
    input: "DESCRIBE sales.orders",
    expectOk: true,
  },
  {
    name: "EXPLAIN ANALYZE is rejected (it actually executes and scans data)",
    input: "EXPLAIN ANALYZE SELECT order_date, COUNT(*) FROM sales.orders GROUP BY order_date",
    expectOk: false,
  },
  {
    name: "plain EXPLAIN is ok and gets no injected LIMIT (returns a plan, not rows)",
    input: "EXPLAIN SELECT * FROM sales.orders",
    expectOk: true,
    expectRewritten: false,
    expectNormalizedSql: "EXPLAIN SELECT * FROM sales.orders",
  },
];
