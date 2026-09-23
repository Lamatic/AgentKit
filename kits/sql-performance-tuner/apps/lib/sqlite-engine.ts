import { createHash } from "node:crypto";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

import initSqlJs, { type Database, type QueryExecResult, type SqlJsStatic } from "sql.js";

import {
  BENCHMARK_MEASURED_RUNS,
  BENCHMARK_WARMUP_RUNS,
  MAX_RESULT_ROWS,
  type Benchmark,
  type QueryPlanStep,
  type QueryResult,
  type TableSchema,
} from "./contracts";
import { queryHasExplicitOrder } from "./sql-safety";

let sqlPromise: Promise<SqlJsStatic> | undefined;

export function getSqlJs(): Promise<SqlJsStatic> {
  sqlPromise ??= initSqlJs({
    locateFile: () => join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
  });
  return sqlPromise;
}

function firstResult(database: Database, sql: string): QueryExecResult {
  const results = database.exec(sql, { maxRows: MAX_RESULT_ROWS + 1 });
  return results[0] ?? { columns: [], values: [] };
}

function canonicalCell(value: unknown): unknown {
  if (value instanceof Uint8Array) return Buffer.from(value).toString("hex");
  if (typeof value === "number" && Object.is(value, -0)) return 0;
  return value;
}

export function inspectResult(database: Database, sql: string): QueryResult {
  const result = firstResult(database, sql);
  const exceededRowLimit = result.values.length > MAX_RESULT_ROWS;
  if (exceededRowLimit) {
    return {
      columns: result.columns,
      rowCount: result.values.length,
      ordered: queryHasExplicitOrder(sql),
      hash: "row-limit-exceeded",
      exceededRowLimit: true,
    };
  }

  const rows = result.values.map((row) => JSON.stringify(row.map(canonicalCell)));
  const ordered = queryHasExplicitOrder(sql);
  if (!ordered) rows.sort();

  return {
    columns: result.columns,
    rowCount: rows.length,
    ordered,
    hash: createHash("sha256").update(JSON.stringify([result.columns, rows])).digest("hex"),
    exceededRowLimit: false,
  };
}

export function resultsAreEquivalent(baseline: QueryResult, candidate: QueryResult): boolean {
  return (
    !baseline.exceededRowLimit &&
    !candidate.exceededRowLimit &&
    baseline.rowCount === candidate.rowCount &&
    baseline.columns.length === candidate.columns.length &&
    baseline.columns.every((column, index) => column === candidate.columns[index]) &&
    baseline.hash === candidate.hash
  );
}

export function explainQuery(database: Database, sql: string): QueryPlanStep[] {
  const result = firstResult(database, `EXPLAIN QUERY PLAN ${sql}`);
  return result.values.map((row) => ({
    id: Number(row[0]),
    parentId: Number(row[1]),
    detail: String(row[3]),
  }));
}

export function benchmarkQuery(database: Database, sql: string): Benchmark {
  for (let run = 0; run < BENCHMARK_WARMUP_RUNS; run += 1) database.exec(sql);

  const measuredRuns: number[] = [];
  for (let run = 0; run < BENCHMARK_MEASURED_RUNS; run += 1) {
    const start = performance.now();
    database.exec(sql);
    measuredRuns.push(Number((performance.now() - start).toFixed(3)));
  }

  const sorted = [...measuredRuns].sort((a, b) => a - b);
  return {
    warmupRuns: BENCHMARK_WARMUP_RUNS,
    measuredRuns,
    medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0,
  };
}

export function cloneDatabase(SQL: SqlJsStatic, source: Database): Database {
  return new SQL.Database(source.export());
}

export function readSchema(database: Database): TableSchema[] {
  const tables = database.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )[0]?.values ?? [];

  return tables.map(([rawName]) => {
    const name = String(rawName);
    const escaped = name.replace(/'/g, "''");
    const columns = (database.exec(`PRAGMA table_info('${escaped}')`)[0]?.values ?? []).map((row) => ({
      name: String(row[1]),
      declaredType: String(row[2] || "BLOB"),
      nullable: !Boolean(row[3]),
      primaryKeyPosition: Number(row[5]),
    }));
    const indexes = (database.exec(`PRAGMA index_list('${escaped}')`)[0]?.values ?? []).map((row) => {
      const indexName = String(row[1]);
      const indexEscaped = indexName.replace(/'/g, "''");
      const indexColumns = (database.exec(`PRAGMA index_info('${indexEscaped}')`)[0]?.values ?? []).map(
        (column) => String(column[2]),
      );
      return { name: indexName, columns: indexColumns, unique: Boolean(row[2]) };
    });
    const count = database.exec(`SELECT COUNT(*) FROM "${name.replace(/"/g, '""')}"`)[0]?.values[0]?.[0];
    return { name, columns, indexes, estimatedRows: Number(count ?? 0) };
  });
}
