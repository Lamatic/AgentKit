const LIVE_RATE_LIMIT = 5;
const LIVE_RATE_WINDOW_MS = 60_000;
const MAX_LOCAL_CLIENTS = 10_000;
export const REDIS_REQUEST_TIMEOUT_MS = 5_000;

type LocalWindow = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const localWindows = new Map<string, LocalWindow>();

export class RateLimitConfigurationError extends Error {}

function pruneLocalWindows(now: number): void {
  for (const [key, window] of localWindows) {
    if (window.resetAt <= now) localWindows.delete(key);
  }

  while (localWindows.size >= MAX_LOCAL_CLIENTS) {
    const oldest = localWindows.keys().next().value;
    if (oldest === undefined) break;
    localWindows.delete(oldest);
  }
}

export function checkLocalRateLimit(key: string, now = Date.now()): RateLimitResult {
  pruneLocalWindows(now);
  const existing = localWindows.get(key);
  if (!existing) {
    localWindows.set(key, { count: 1, resetAt: now + LIVE_RATE_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count >= LIVE_RATE_LIMIT) return { allowed: false, retryAfterSeconds };

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function clientAddress(request: Request): string {
  if (process.env.VERCEL === "1") {
    return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";
  }
  return request.headers.get("x-real-ip") || "local";
}

export async function checkRedisRateLimit(
  key: string,
  signal?: AbortSignal,
  timeoutMs = REDIS_REQUEST_TIMEOUT_MS,
): Promise<RateLimitResult> {
  const configuredUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!configuredUrl || !token) {
    throw new RateLimitConfigurationError("Distributed rate limiting is not configured.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new RateLimitConfigurationError("UPSTASH_REDIS_REST_URL must be a valid HTTPS URL.");
  }
  if (parsedUrl.protocol !== "https:") {
    throw new RateLimitConfigurationError(
      "UPSTASH_REDIS_REST_URL must use HTTPS before the Redis token can be sent.",
    );
  }
  const url = parsedUrl.toString().replace(/\/$/, "");
  const deadlineController = new AbortController();
  const deadlineTimer = setTimeout(() => deadlineController.abort(), timeoutMs);
  const combinedSignal = signal
    ? AbortSignal.any([signal, deadlineController.signal])
    : deadlineController.signal;

  const script = [
    "local current = redis.call('INCR', KEYS[1])",
    "if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
    "local ttl = redis.call('PTTL', KEYS[1])",
    "return {current, ttl}",
  ].join("\n");
  let payload: { result?: unknown };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["EVAL", script, "1", `sql-tuner:live:${key}`, String(LIVE_RATE_WINDOW_MS)]),
      cache: "no-store",
      redirect: "error",
      signal: combinedSignal,
    });
    if (!response.ok) throw new Error(`Rate-limit service returned HTTP ${response.status}.`);
    payload = await response.json() as { result?: unknown };
  } catch (error) {
    if (deadlineController.signal.aborted && !signal?.aborted) {
      throw new Error("Rate-limit service timed out.");
    }
    throw error;
  } finally {
    clearTimeout(deadlineTimer);
  }
  if (!Array.isArray(payload.result) || payload.result.length !== 2) {
    throw new Error("Rate-limit service returned an invalid response.");
  }
  const count = Number(payload.result[0]);
  const ttlMs = Number(payload.result[1]);
  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
    throw new Error("Rate-limit service returned invalid counters.");
  }
  return {
    allowed: count <= LIVE_RATE_LIMIT,
    retryAfterSeconds: count <= LIVE_RATE_LIMIT ? 0 : Math.max(1, Math.ceil(ttlMs / 1000)),
  };
}

export async function checkLiveRateLimit(request: Request): Promise<RateLimitResult> {
  const address = clientAddress(request);
  const hasRedisUrl = Boolean(process.env.UPSTASH_REDIS_REST_URL);
  const hasRedisToken = Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (hasRedisUrl !== hasRedisToken) {
    throw new RateLimitConfigurationError(
      "Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  if (hasRedisUrl) return checkRedisRateLimit(address, request.signal);
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    throw new RateLimitConfigurationError(
      "Live mode requires distributed rate limiting in production.",
    );
  }
  return checkLocalRateLimit(address);
}
