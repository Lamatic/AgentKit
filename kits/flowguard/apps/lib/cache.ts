import { createHash } from 'crypto';

/**
 * Content-hash cache. Identical (flowId, input, flowVersionTag) executions and
 * identical (output, rubricVersion) judgments are cached, which cuts the cost of
 * re-running a suite dramatically while debugging or re-testing a small change.
 */

function hash(parts: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 24);
}

export function execCacheKey(
  flowId: string,
  input: unknown,
  flowVersionTag = 'live'
): string {
  return 'exec:' + hash([flowId, input, flowVersionTag]);
}

export function judgeCacheKey(
  actualOutput: string,
  expectedBehavior: string,
  rubricVersion: string
): string {
  return 'judge:' + hash([actualOutput, expectedBehavior, rubricVersion]);
}

/** Tiny in-process cache. Swap for Redis/Supabase behind this interface later. */
class MemoryCache {
  private store = new Map<string, { v: unknown; hits: number }>();

  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    e.hits += 1;
    return e.v as T;
  }
  set(key: string, v: unknown): void {
    this.store.set(key, { v, hits: 0 });
  }
  has(key: string): boolean {
    return this.store.has(key);
  }
  clear(): void {
    this.store.clear();
  }
}

export const cache = new MemoryCache();
