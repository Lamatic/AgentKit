/**
 * SparkTrace — Athena Query Executor (live mode)
 * ------------------------------------------------------------------
 * Implements `QueryExecutor` against AWS Athena. Every query passed
 * in here is assumed to have already passed `safety/query-guard.ts`
 * — this client does not re-validate SQL, it only executes it against
 * a read-only-configured Athena workgroup (enforced by AWS IAM /
 * workgroup config, not by this code — see README).
 *
 * Never throws on query failure or AWS errors: callers get back a
 * `QueryExecutionResult` with `.error` set instead, so the
 * investigation loop can keep going / let the analyst reason about
 * the failure.
 *
 * Env vars read:
 *   - AWS_REGION              AWS region for the Athena client
 *   - ATHENA_WORKGROUP        Read-only-configured Athena workgroup name
 *   - ATHENA_OUTPUT_LOCATION  s3:// location Athena writes query results to
 */

import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  type QueryExecutionState,
  type Row,
  type ColumnInfo,
} from "@aws-sdk/client-athena";

import type { DiagnosticQuery, QueryExecutionResult, QueryExecutor } from "../contracts";
import { MAX_ROWS } from "../contracts";

// The row cap is defined in contracts.ts so the demo executor can share it
// without dragging the AWS SDK into the demo import graph; re-exported here
// so existing `from "../aws/athena-client"` import paths keep working.
export { MAX_ROWS };

/** Max time to wait for a query to finish before giving up. */
const POLL_TIMEOUT_MS = 60_000;
/** Delay between GetQueryExecution polls. */
const POLL_INTERVAL_MS = 700;
/** Cap on the exponential poll backoff. */
const MAX_POLL_INTERVAL_MS = 5_000;

const TERMINAL_STATES: QueryExecutionState[] = ["SUCCEEDED", "FAILED", "CANCELLED"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var ${name} for Athena live client.`);
  }
  return v;
}

/**
 * Converts one Athena result page into plain objects keyed by column
 * name. Athena returns every value as `VarCharValue` (or omits `Data`
 * entirely for SQL NULL), regardless of the column's real type, so
 * values are kept as `string | null` rather than coerced.
 */
function rowsToRecords(columns: ColumnInfo[], rows: Row[]): Array<Record<string, unknown>> {
  const names = columns.map((c) => c.Name ?? "");
  return rows.map((row) => {
    const record: Record<string, unknown> = {};
    const data = row.Data ?? [];
    for (let i = 0; i < names.length; i++) {
      const cell = data[i];
      record[names[i]] = cell && "VarCharValue" in cell ? cell.VarCharValue ?? null : null;
    }
    return record;
  });
}

export class AthenaQueryExecutor implements QueryExecutor {
  readonly mode = "live" as const;

  private client: AthenaClient;
  private workgroup: string;
  private outputLocation: string;

  constructor(opts?: { region?: string; workgroup?: string; outputLocation?: string }) {
    const region = opts?.region ?? readEnv("AWS_REGION");
    this.workgroup = opts?.workgroup ?? readEnv("ATHENA_WORKGROUP");
    this.outputLocation = opts?.outputLocation ?? readEnv("ATHENA_OUTPUT_LOCATION");
    this.client = new AthenaClient({ region });
  }

  async execute(query: DiagnosticQuery): Promise<QueryExecutionResult> {
    const started = Date.now();
    const base: Omit<QueryExecutionResult, "error"> = {
      queryId: query.id,
      columns: [],
      rows: [],
      rowCount: 0,
      runtimeMs: 0,
      engine: "athena",
    };

    let queryExecutionId: string | undefined;

    try {
      const start = await this.client.send(
        new StartQueryExecutionCommand({
          QueryString: query.sql,
          WorkGroup: this.workgroup,
          ResultConfiguration: { OutputLocation: this.outputLocation },
        })
      );
      queryExecutionId = start.QueryExecutionId;
      if (!queryExecutionId) {
        return { ...base, runtimeMs: Date.now() - started, error: "Athena did not return a QueryExecutionId." };
      }

      let state: QueryExecutionState | undefined;
      let stateChangeReason: string | undefined;
      let bytesScanned: number | undefined;
      let engineMs: number | undefined;
      let pollDelay = POLL_INTERVAL_MS;

      while (true) {
        const exec = await this.client.send(
          new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId })
        );
        const qe = exec.QueryExecution;
        state = qe?.Status?.State;
        stateChangeReason = qe?.Status?.StateChangeReason;
        bytesScanned = qe?.Statistics?.DataScannedInBytes;
        engineMs = qe?.Statistics?.EngineExecutionTimeInMillis;

        if (state && TERMINAL_STATES.includes(state)) break;
        if (Date.now() - started > POLL_TIMEOUT_MS) {
          return {
            ...base,
            runtimeMs: Date.now() - started,
            bytesScanned,
            error: `Timed out waiting for Athena query ${queryExecutionId} to finish (last state: ${state ?? "unknown"}).`,
          };
        }
        await sleep(pollDelay);
        pollDelay = Math.min(pollDelay * 1.5, MAX_POLL_INTERVAL_MS);
      }

      const runtimeMs = engineMs ?? Date.now() - started;

      if (state !== "SUCCEEDED") {
        return {
          ...base,
          runtimeMs,
          bytesScanned,
          error: stateChangeReason ?? `Athena query ended in state ${state ?? "unknown"}.`,
        };
      }

      // Page through results, capping at MAX_ROWS. Athena repeats the column
      // names as the first data row of the first page — but ONLY for
      // SELECT-shaped results. DESCRIBE / SHOW / EXPLAIN (all permitted by
      // the query guard) return real data in row 0, so stripping it there
      // would silently discard a row.
      const leadingKeyword = query.sql
        .replace(/^﻿/, "")
        .replace(/^\s*(?:--[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*/, "")
        .slice(0, 16)
        .trimStart()
        .toUpperCase();
      const hasHeaderRow = /^(SELECT|WITH)\b/.test(leadingKeyword);

      let columns: string[] = [];
      let rows: Array<Record<string, unknown>> = [];
      let nextToken: string | undefined;
      let isFirstPage = true;
      let truncated = false;

      do {
        const page = await this.client.send(
          new GetQueryResultsCommand({
            QueryExecutionId: queryExecutionId,
            NextToken: nextToken,
            MaxResults: Math.min(
              1000,
              MAX_ROWS - rows.length + (isFirstPage && hasHeaderRow ? 1 : 0)
            ),
          })
        );

        const columnInfo = page.ResultSet?.ResultSetMetadata?.ColumnInfo ?? [];
        if (columns.length === 0) {
          columns = columnInfo.map((c) => c.Name ?? "");
        }

        let pageRows: Row[] = page.ResultSet?.Rows ?? [];
        if (isFirstPage) {
          if (hasHeaderRow && pageRows.length > 0) {
            pageRows = pageRows.slice(1); // drop the repeated column-name row
          }
          // Flip regardless of whether this page had rows, so an empty
          // first page can't cause the *next* page's first row to be
          // mistaken for a header and dropped.
          isFirstPage = false;
        }

        const remaining = MAX_ROWS - rows.length;
        if (pageRows.length > remaining) {
          pageRows = pageRows.slice(0, remaining);
          truncated = true;
        }

        rows = rows.concat(rowsToRecords(columnInfo, pageRows));
        nextToken = page.NextToken;

        if (rows.length >= MAX_ROWS && nextToken) {
          truncated = true;
          break;
        }
      } while (nextToken);

      return {
        queryId: query.id,
        columns,
        rows,
        rowCount: rows.length,
        bytesScanned,
        runtimeMs,
        engine: "athena",
        truncated: truncated || undefined,
      };
    } catch (err) {
      return {
        ...base,
        runtimeMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/** Factory the orchestrator should import for live mode. */
export function makeAthenaExecutor(opts?: {
  region?: string;
  workgroup?: string;
  outputLocation?: string;
}): QueryExecutor {
  return new AthenaQueryExecutor(opts);
}
