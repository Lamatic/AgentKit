/**
 * SparkTrace — Result Compactor
 * ------------------------------------------------------------------
 * THE token-saver. Pure function, zero external dependencies, NO
 * network/API calls. The orchestrator MUST call `compact(result)` on
 * every `QueryExecutionResult` before it is handed to any model
 * (`LamaticReasoner.analyze`) — models NEVER see `QueryExecutionResult.rows`
 * directly, only a `CompactResult` with a bounded sample and precomputed
 * stats. See ARCHITECTURE.md / contracts.ts for the module boundary.
 *
 * Strategy:
 *   1. Sample: take up to MAX_SAMPLE_ROWS (10) rows as a head+tail sample
 *      (first half from the head, remainder from the tail) so a model
 *      sees both "early" and "late" rows rather than just a prefix —
 *      important for e.g. ORDER BY order_date results where the
 *      anomaly clusters at the end.
 *   2. Stats: for every column, deterministically infer a type
 *      ("number" | "string" | "boolean" | "null" | "mixed") from the
 *      FULL row set (not just the sample) and compute:
 *        - numeric columns: min / max / avg / null count
 *        - all columns: a distinct-value count, capped by
 *          DISTINCT_SCAN_CAP so a huge result can't make compaction
 *          itself expensive
 *   3. Date span: if a column's values look like ISO-8601 dates
 *      (`YYYY-MM-DD` or a full timestamp), compute its min/max as a
 *      `dateSpan` on the result.
 *   4. `truncated` is true when the executor ALREADY truncated the result
 *      (both the Athena and demo executors cap rows at MAX_ROWS before
 *      `compact()` ever sees them, and set `truncated` when they do) OR
 *      when `rowCount` exceeds the sample size actually returned.
 *   5. `.error` passes through untouched (compaction of a failed
 *      execution is a no-op besides carrying the error and query id).
 */

import type {
  ColumnStat,
  CompactResult,
  QueryExecutionResult,
  ResultStats,
} from "../contracts";
import { MAX_SAMPLE_ROWS } from "../contracts";

/** Cap on how many rows are scanned to build a per-column distinct-value
 * count. Keeps compaction itself O(bounded) even for a large result. */
const DISTINCT_SCAN_CAP = 5000;

/** ISO-8601 date or date-time, e.g. "2024-01-08" or "2024-01-08T00:00:00Z". */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

type ColumnValueType = "number" | "string" | "boolean" | "null" | "mixed";

function valueType(v: unknown): ColumnValueType {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return "number";
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "string") return "string";
  return "mixed";
}

/** Combine a running column type with a newly observed value's type. */
function mergeType(current: ColumnValueType | undefined, next: ColumnValueType): ColumnValueType {
  if (!current || current === "null") return next;
  if (next === "null") return current;
  if (current === next) return current;
  return "mixed";
}

function looksLikeIsoDate(v: unknown): v is string {
  return typeof v === "string" && ISO_DATE_RE.test(v);
}

/**
 * Builds a bounded, self-contained distinct-value key for a raw cell value.
 * Type-tags primitives so e.g. the number 1 and the string "1" never
 * collide, and safely serializes objects — falling back to a stable
 * token (rather than throwing) for values `JSON.stringify` can't handle,
 * such as nested `bigint` or cyclic references. Never throws.
 */
function distinctKey(raw: unknown): string {
  if (raw === null) return "null";
  if (raw === undefined) return "undefined";
  switch (typeof raw) {
    case "number":
      return `n:${raw}`;
    case "string":
      return `s:${raw}`;
    case "boolean":
      return `b:${raw}`;
    case "bigint":
      return `bi:${raw}`;
    default:
      try {
        return `o:${JSON.stringify(raw)}`;
      } catch {
        return "o:[unserializable]";
      }
  }
}

/**
 * Head+tail sample of up to MAX_SAMPLE_ROWS rows: first ceil(n/2) rows
 * from the head, last floor(n/2) rows from the tail (deduped when the
 * two windows would overlap on a small result).
 */
function headTailSample<T>(rows: T[], limit: number): T[] {
  if (rows.length <= limit) return rows.slice();
  const headCount = Math.ceil(limit / 2);
  const tailCount = limit - headCount;
  const head = rows.slice(0, headCount);
  const tail = tailCount > 0 ? rows.slice(rows.length - tailCount) : [];
  return [...head, ...tail];
}

function computeColumnStats(columns: string[], rows: Array<Record<string, unknown>>): ColumnStat[] {
  return columns.map((name) => {
    let type: ColumnValueType | undefined;
    let min: number | undefined;
    let max: number | undefined;
    let sum = 0;
    let numericCount = 0;
    let nulls = 0;
    const distinct = new Set<string>();
    let distinctCapped = false;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i][name];
      const t = valueType(raw);
      type = mergeType(type, t);

      if (raw === null || raw === undefined) {
        nulls++;
      } else if (t === "number") {
        const n = raw as number;
        if (min === undefined || n < min) min = n;
        if (max === undefined || n > max) max = n;
        sum += n;
        numericCount++;
      }

      if (i < DISTINCT_SCAN_CAP) {
        distinct.add(distinctKey(raw));
      } else {
        distinctCapped = true;
      }
    }

    const stat: ColumnStat = {
      name,
      type: type ?? "null",
    };

    if (numericCount > 0) {
      stat.min = min;
      stat.max = max;
      stat.avg = sum / numericCount;
    } else if (type === "string") {
      // Non-numeric columns still get a lexical min/max (useful for
      // dates/ids even when not parsed as an ISO date span).
      let strMin: string | undefined;
      let strMax: string | undefined;
      for (const row of rows) {
        const raw = row[name];
        if (typeof raw !== "string") continue;
        if (strMin === undefined || raw < strMin) strMin = raw;
        if (strMax === undefined || raw > strMax) strMax = raw;
      }
      if (strMin !== undefined) stat.min = strMin;
      if (strMax !== undefined) stat.max = strMax;
    }

    if (nulls > 0) stat.nulls = nulls;
    // When the scan was capped, `distinct.size` is a lower bound on the
    // true distinct count, not an exact one — flag it on its own field so
    // callers (and models) can tell the two cases apart WITHOUT `type`
    // ceasing to be a plain value-type label.
    stat.distinct = distinct.size;
    if (distinctCapped) {
      stat.distinctCapped = true;
    }

    return stat;
  });
}

/** Finds the first column whose non-null values all look like ISO dates
 * and returns its min/max span. */
function computeDateSpan(
  columns: string[],
  rows: Array<Record<string, unknown>>
): ResultStats["dateSpan"] {
  for (const column of columns) {
    let sawValue = false;
    let allIsoDates = true;
    let min: string | undefined;
    let max: string | undefined;

    for (const row of rows) {
      const raw = row[column];
      if (raw === null || raw === undefined) continue;
      sawValue = true;
      if (!looksLikeIsoDate(raw)) {
        allIsoDates = false;
        break;
      }
      if (min === undefined || raw < min) min = raw;
      if (max === undefined || raw > max) max = raw;
    }

    if (sawValue && allIsoDates && min !== undefined && max !== undefined) {
      return { column, min, max };
    }
  }

  return undefined;
}

/**
 * Compacts a raw `QueryExecutionResult` into a bounded `CompactResult`
 * safe to hand to a model: a head+tail sample of at most
 * `MAX_SAMPLE_ROWS` rows plus deterministic per-column stats. Pure,
 * synchronous, no I/O. Never throws.
 */
export function compact(result: QueryExecutionResult): CompactResult {
  const base: CompactResult = {
    queryId: result.queryId,
    columns: result.columns,
    sampleRows: [],
    stats: { columns: [] },
    rowCount: result.rowCount,
    bytesScanned: result.bytesScanned,
    runtimeMs: result.runtimeMs,
    truncated: false,
  };

  if (result.error) {
    return { ...base, error: result.error };
  }

  const rows = result.rows ?? [];
  const columns = result.columns ?? (rows.length > 0 ? Object.keys(rows[0]) : []);
  const sampleRows = headTailSample(rows, MAX_SAMPLE_ROWS);
  const stats: ResultStats = {
    columns: computeColumnStats(columns, rows),
  };
  const dateSpan = computeDateSpan(columns, rows);
  if (dateSpan) stats.dateSpan = dateSpan;

  return {
    queryId: result.queryId,
    columns,
    sampleRows,
    stats,
    rowCount: result.rowCount,
    bytesScanned: result.bytesScanned,
    runtimeMs: result.runtimeMs,
    truncated: result.truncated === true || result.rowCount > sampleRows.length,
  };
}
