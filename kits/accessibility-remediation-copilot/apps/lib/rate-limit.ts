const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_TRACKED_CLIENTS = 10_000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStoreGlobal = typeof globalThis & {
  accessFixRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitGlobal = globalThis as RateLimitStoreGlobal;
const store =
  rateLimitGlobal.accessFixRateLimitStore ??
  (rateLimitGlobal.accessFixRateLimitStore = new Map<string, RateLimitEntry>());

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function pruneExpiredEntries(now: number) {
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

export function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";

  return clientIp.slice(0, 128);
}

export function consumeAuditRequest(clientIdentifier: string, now = Date.now()): RateLimitResult {
  pruneExpiredEntries(now);

  const entry = store.get(clientIdentifier);
  if (!entry || entry.resetAt <= now) {
    store.set(clientIdentifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      retryAfterSeconds,
    };
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
