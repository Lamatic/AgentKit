const WINDOW_MS = 10 * 60 * 1_000;
const MAX_REQUESTS = 5;

type Entry = { count: number; resetAt: number };
const requests = new Map<string, Entry>();

export function allowInvestigationRequest(
  key: string,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetInvestigationRateLimitsForTest() {
  requests.clear();
}
