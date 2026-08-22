/**
 * Bounded-concurrency execution with per-task timeout and one retry with
 * exponential backoff + jitter. Every task is isolated (Promise.allSettled
 * semantics): a single failure returns an `errored` result rather than
 * rejecting the whole run.
 */

export interface PoolResult<T> {
  index: number;
  outcome: 'ok' | 'timeout' | 'errored';
  value: T | null;
  latencyMs: number;
  retries: number;
  error?: string;
}

const TRANSIENT = /timeout|rate.?limit|429|50\d|econnreset|network|fetch failed/i;

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runOne<T>(
  task: () => Promise<T>,
  timeoutMs: number,
  maxRetries: number
): Promise<PoolResult<T>> {
  const start = Date.now();
  let retries = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const value = await timeout(task(), timeoutMs);
      return {
        index: -1,
        outcome: 'ok',
        value,
        latencyMs: Date.now() - start,
        retries,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTimeout = /timeout/i.test(msg);
      const transient = TRANSIENT.test(msg);
      if (transient && retries < maxRetries) {
        retries += 1;
        const backoff = 250 * 2 ** (retries - 1) + Math.random() * 200;
        await sleep(backoff);
        continue;
      }
      return {
        index: -1,
        outcome: isTimeout ? 'timeout' : 'errored',
        value: null,
        latencyMs: Date.now() - start,
        retries,
        error: msg,
      };
    }
  }
}

export interface PoolOptions {
  concurrency?: number;
  timeoutMs?: number;
  maxRetries?: number;
  onSettled?: (r: PoolResult<unknown>) => void;
}

/**
 * Map `tasks` through a bounded pool. Results are returned in input order.
 * `onSettled` fires as each task finishes (used for progressive UI streaming).
 */
export async function runPool<T>(
  tasks: Array<() => Promise<T>>,
  opts: PoolOptions = {}
): Promise<Array<PoolResult<T>>> {
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const maxRetries = opts.maxRetries ?? 1;

  const results: Array<PoolResult<T>> = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;
      const r = await runOne(tasks[i], timeoutMs, maxRetries);
      r.index = i;
      results[i] = r;
      opts.onSettled?.(r as PoolResult<unknown>);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}
