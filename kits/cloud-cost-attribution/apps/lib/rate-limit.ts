// In-memory, per-serverless-instance store — the effective limit scales with
// the number of warm instances behind the deployment. Fine for this kit's demo
// scope; a real deployment needing a global limit should back this with a
// shared store (Upstash Redis, available through the Vercel Marketplace) instead.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_TRACKED_CLIENTS = 10_000;

type RateLimitEntry = { count: number; resetAt: number };

type RateLimitStoreGlobal = typeof globalThis & {
  costAttributionRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitGlobal = globalThis as RateLimitStoreGlobal;
const store =
  rateLimitGlobal.costAttributionRateLimitStore ??
  (rateLimitGlobal.costAttributionRateLimitStore = new Map<string, RateLimitEntry>());

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function pruneExpiredEntries(now: number): void {
  if (store.size < MAX_TRACKED_CLIENTS) return;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
  while (store.size >= MAX_TRACKED_CLIENTS) {
    const oldestKey = store.keys().next().value as string | undefined;
    if (!oldestKey) break;
    store.delete(oldestKey);
  }
}

// x-real-ip is set once by the trusted edge (Vercel) and can't be spoofed by the
// client. x-forwarded-for is a client-appended hop chain — its *leftmost* entry
// is whatever the client claims, attacker-controlled; only the rightmost entry
// (the hop nearest this server, appended by the trusted proxy) is safe to trust.
export function getClientIdentifier(headerList: Headers): string {
  const trusted = headerList.get("x-real-ip")?.trim();
  if (trusted) return trusted.slice(0, 128);

  const forwardedFor = headerList.get("x-forwarded-for");
  const hops = forwardedFor?.split(",").map((h) => h.trim()).filter(Boolean) ?? [];
  const clientIp = hops.length > 0 ? hops[hops.length - 1] : "unknown";
  return clientIp.slice(0, 128);
}

/** Rate limit every `analyze` invocation. */
export function consumeAnalyzeRequest(clientIdentifier: string, now = Date.now()): RateLimitResult {
  pruneExpiredEntries(now);

  const entry = store.get(clientIdentifier);
  if (!entry || entry.resetAt <= now) {
    store.set(clientIdentifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, limit: RATE_LIMIT_MAX_REQUESTS, remaining: 0, retryAfterSeconds };
  }

  entry.count += 1;
  store.set(clientIdentifier, entry);
  return {
    allowed: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    retryAfterSeconds,
  };
}
