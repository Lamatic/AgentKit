// rate-limit.ts — a small in-memory limiter for the scan action.
//
// Every scan costs a vision-model call, so an unthrottled deployment is someone
// else's bill. This is deliberately dependency-free: a kit that needs Redis to
// run locally is a kit most people never run.
//
// Scope, stated plainly because it matters when this is deployed: the counter
// lives in process memory. On serverless it is per-instance, so the effective
// limit across a scaled-out deployment is higher than the number below. That is
// an acceptable trade for a demo kit — it stops runaway loops and casual abuse,
// which is what it is for. A production deployment should swap in a shared
// store; the function signatures here are the ones to keep.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;
const MAX_TRACKED_CLIENTS = 10_000;

interface Entry {
  count: number;
  resetAt: number;
}

/**
 * The store is stashed on `globalThis` so it survives Next.js dev-server hot
 * reloads. Without this the limiter resets on every file save.
 */
type StoreHost = typeof globalThis & { __orderlyRateStore?: Map<string, Entry> };

const host = globalThis as StoreHost;
const store: Map<string, Entry> =
  host.__orderlyRateStore ?? (host.__orderlyRateStore = new Map());

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. Suitable for a Retry-After header. */
  retryAfterSeconds: number;
}

/**
 * Drops expired entries, then evicts oldest-first if still at capacity.
 *
 * The cap is what stops a stream of unique client IDs from growing the map
 * without bound.
 */
function prune(now: number): void {
  if (store.size < MAX_TRACKED_CLIENTS) return;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }

  while (store.size >= MAX_TRACKED_CLIENTS) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/**
 * Derives a client key from request headers.
 *
 * `x-forwarded-for` is trusted here because this runs behind a platform proxy
 * that sets it. Direct-to-internet deployments should not trust it blindly.
 */
export function getClientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown";
  return ip.slice(0, 128);
}

/**
 * Records a request against a client and reports whether it is allowed.
 *
 * @param now - Injectable clock, so the behaviour is testable without waiting
 *   ten minutes for a window to roll over.
 */
export function consumeRequest(
  clientId: string,
  now: number = Date.now()
): RateLimitResult {
  prune(now);

  const entry = store.get(clientId);

  if (entry === undefined || entry.resetAt <= now) {
    store.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return {
      allowed: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, limit: MAX_REQUESTS, remaining: 0, retryAfterSeconds };
  }

  entry.count += 1;
  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - entry.count,
    retryAfterSeconds,
  };
}

/** Clears all counters. Exists for tests. */
export function resetRateLimits(): void {
  store.clear();
}
