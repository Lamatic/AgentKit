import { join } from "node:path";
import { Worker } from "node:worker_threads";

import {
  BENCHMARK_MEASURED_RUNS,
  BENCHMARK_WARMUP_RUNS,
  MAX_DATABASE_BYTES,
  MAX_RESULT_BYTES,
  MAX_RESULT_ROWS,
  type Benchmark,
  type QueryPlanStep,
  type QueryResult,
  type TableSchema,
} from "./contracts";
import { validateReadOnlyQuery } from "./sql-safety";

export const SQL_EXECUTION_TIMEOUT_MS = 5_000;
export const SQL_WORKER_MAX_OLD_GENERATION_MB = 64;

export type SqlWorkerTask = {
  databaseBytes: Uint8Array;
  query: string;
  ordered: boolean;
  indexSql?: string;
  includeSchema?: boolean;
};

export type SqlWorkerResult = {
  schema?: TableSchema[];
  result: QueryResult;
  plan?: QueryPlanStep[];
  benchmark?: Benchmark;
};

type WorkerResponse =
  | { ok: true; value: SqlWorkerResult }
  | { ok: false; error: string };

export function runSqlWorkerTask(
  task: SqlWorkerTask,
  signal?: AbortSignal,
  timeoutMs = SQL_EXECUTION_TIMEOUT_MS,
): Promise<SqlWorkerResult> {
  if (signal?.aborted) return Promise.reject(new Error("The tuning request was cancelled."));
  if (task.databaseBytes.byteLength > MAX_DATABASE_BYTES) {
    return Promise.reject(new Error("SQLite uploads are limited to 4 MB."));
  }
  const query = validateReadOnlyQuery(task.query);

  return new Promise((resolve, reject) => {
    const worker = new Worker(join(process.cwd(), "lib", "sql-worker.cjs"), {
      resourceLimits: {
        maxOldGenerationSizeMb: SQL_WORKER_MAX_OLD_GENERATION_MB,
        maxYoungGenerationSizeMb: 16,
        codeRangeSizeMb: 16,
        stackSizeMb: 4,
      },
      workerData: {
        ...task,
        query,
        databaseBytes: Uint8Array.from(task.databaseBytes),
        maxResultBytes: MAX_RESULT_BYTES,
        maxResultRows: MAX_RESULT_ROWS,
        warmupRuns: BENCHMARK_WARMUP_RUNS,
        measuredRuns: BENCHMARK_MEASURED_RUNS,
        sqlJsModulePath: join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.js"),
        wasmPath: join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
      },
    });
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      signal?.removeEventListener("abort", handleAbort);
      callback();
    };
    const stopWithError = (error: Error) => {
      void worker.terminate();
      finish(() => reject(error));
    };
    const handleAbort = () => stopWithError(new Error("The tuning request was cancelled."));
    const deadline = setTimeout(
      () => stopWithError(new Error(`SQLite execution exceeded the ${timeoutMs} ms safety deadline.`)),
      timeoutMs,
    );

    signal?.addEventListener("abort", handleAbort, { once: true });
    worker.once("message", (message: WorkerResponse) => {
      finish(() => {
        if (message.ok) resolve(message.value);
        else reject(new Error(message.error));
      });
    });
    worker.once("error", (error) => finish(() => reject(error)));
    worker.once("exit", (code) => {
      if (code !== 0) finish(() => reject(new Error(`SQLite worker stopped with exit code ${code}.`)));
    });
  });
}
