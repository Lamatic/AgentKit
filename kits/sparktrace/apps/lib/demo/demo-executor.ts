/**
 * SparkTrace demo mode — QueryExecutor that ACTUALLY RUNS the generated
 * read-only SQL against the bundled sample CSVs, using alasql (a pure-JS
 * in-memory SQL engine, no native build). This makes demo mode run
 * identically on Windows, Linux CI, and any grader's machine with a
 * plain `npm install` — no node-gyp / prebuilt-binary toolchain needed.
 *
 * Every table in scenario.json is registered under BOTH its unqualified
 * name (`orders`) and, via SQL normalization, its schema-qualified form
 * (`raw.orders`, `finance.daily_revenue`), so generated SQL works
 * whichever style the reasoning layer emits.
 *
 * Never throws: any failure (unknown table, syntax error, missing CSV)
 * is caught and returned as a QueryExecutionResult with `.error` set,
 * per the contracts.ts requirement that orchestrate.ts can treat live
 * and demo executors identically.
 */

import fs from "node:fs";
import path from "node:path";
// alasql is a pure-JS SQL engine (CommonJS). Typed as any to avoid a
// hard dependency on its bundled types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import alasql from "alasql";

import type {
  DiagnosticQuery,
  ExecutionMode,
  QueryExecutionResult,
  QueryExecutor,
} from "../contracts";
import { MAX_ROWS } from "../contracts";
import { loadScenario, type ScenarioTable } from "./scenario-paths";

/** Minimal, quote-aware CSV parser. The sample data is small and clean;
 * this handles double-quoted fields and embedded commas without pulling
 * in another dependency. */
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/** Coerce numeric-looking cells to JS numbers so SUM/ROUND/AVG work,
 * while leaving ids ("C021"), dates ("2024-01-08"), and text as strings. */
function coerceRow(row: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== "" && /^-?\d+(\.\d+)?$/.test(v)) {
      out[k] = Number(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function csvPathFor(dataDir: string, table: ScenarioTable): string {
  return path.join(dataDir, `${table.name}.csv`);
}

/** Rewrite schema-qualified table references (`raw.orders`,
 * `"finance"."daily_revenue"`) down to the unqualified table name we
 * register with alasql. Only rewrites known scenario tables, so it can't
 * corrupt unrelated `alias.column` references. */
function normalizeQualifiedNames(sql: string, tables: ScenarioTable[]): string {
  let out = sql;
  for (const t of tables) {
    const db = t.database;
    const name = t.name;
    const patterns = [
      new RegExp(`"${db}"\\s*\\.\\s*"${name}"`, "gi"),
      new RegExp(`\\b${db}\\s*\\.\\s*${name}\\b`, "gi"),
    ];
    for (const p of patterns) out = out.replace(p, `\`${name}\``);
  }
  return out;
}

function stripTrailingSemicolons(sql: string): string {
  return sql.trim().replace(/;+\s*$/g, "");
}

/** One shared in-memory alasql database per process, lazily built and
 * memoized so repeated execute() calls reuse the loaded tables. */
let dbPromise: Promise<{ db: any; tables: ScenarioTable[]; dataDir: string }> | null = null;

function getDb() {
  if (dbPromise) return dbPromise;
  const pending = (async () => {
    const { dir, scenario } = loadScenario();
    const dataDir = path.join(dir, "data");
    // alasql's bundled types are loose; treat the DB handle as `any` so
    // `.tables[name].data = rows` (its documented bulk-load path) checks.
    const db: any = new (alasql as any).Database(`sparktrace_demo`);

    for (const table of scenario.tables) {
      const csvPath = csvPathFor(dataDir, table);
      if (!fs.existsSync(csvPath)) {
        throw new Error(
          `SparkTrace demo executor: expected sample CSV at ${csvPath} for table ` +
            `${table.database}.${table.name}, but it does not exist.`
        );
      }
      const rows = parseCsv(fs.readFileSync(csvPath, "utf8")).map(coerceRow);
      db.exec(`CREATE TABLE \`${table.name}\``);
      db.tables[table.name].data = rows;
    }

    return { db, tables: scenario.tables, dataDir };
  })();
  pending.catch(() => {
    // Don't memoize a failure — the next execute() should retry.
    if (dbPromise === pending) dbPromise = null;
  });
  dbPromise = pending;
  return dbPromise;
}

/** Rough proxy for Athena's `bytesScanned`: sum the on-disk size of
 * whichever sample CSVs the query text references. Demo-only estimate. */
function estimateBytesScanned(sql: string, dataDir: string, tables: ScenarioTable[]): number {
  const lower = sql.toLowerCase();
  const matched = tables.filter((t) => lower.includes(t.name.toLowerCase()));
  const relevant = matched.length > 0 ? matched : tables;
  let total = 0;
  for (const t of relevant) {
    try {
      total += fs.statSync(csvPathFor(dataDir, t)).size;
    } catch {
      /* validated in getDb() */
    }
  }
  return total;
}

export class DemoQueryExecutor implements QueryExecutor {
  readonly mode: ExecutionMode = "demo";

  async execute(query: DiagnosticQuery): Promise<QueryExecutionResult> {
    const startedAt = Date.now();
    try {
      const { db, tables, dataDir } = await getDb();
      const normalized = normalizeQualifiedNames(stripTrailingSemicolons(query.sql), tables);

      if (!normalized) {
        return blank(query.id, startedAt, "Empty query.");
      }

      const result = db.exec(normalized) as unknown;
      const rows: Array<Record<string, unknown>> = Array.isArray(result)
        ? (result as Array<Record<string, unknown>>)
        : [];

      const truncated = rows.length > MAX_ROWS;
      const limitedRows = truncated ? rows.slice(0, MAX_ROWS) : rows;
      const columns = limitedRows.length > 0 ? Object.keys(limitedRows[0]) : [];

      return {
        queryId: query.id,
        columns,
        rows: limitedRows,
        rowCount: limitedRows.length,
        bytesScanned: estimateBytesScanned(normalized, dataDir, tables),
        runtimeMs: Date.now() - startedAt,
        // Demo always reports "athena" to keep parity with live mode.
        engine: "athena",
        truncated,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return blank(query.id, startedAt, message);
    }
  }
}

function blank(queryId: string, startedAt: number, error: string): QueryExecutionResult {
  return {
    queryId,
    columns: [],
    rows: [],
    rowCount: 0,
    runtimeMs: Date.now() - startedAt,
    engine: "athena",
    error,
  };
}

export function makeDemoExecutor(): QueryExecutor {
  return new DemoQueryExecutor();
}
