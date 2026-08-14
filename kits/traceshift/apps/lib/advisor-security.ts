import { createHash, timingSafeEqual } from "node:crypto";

type QuotaWindow = { startedAt: number; requests: number };

const quotaWindows = new Map<string, QuotaWindow>();
const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 6;
const MAX_ACTIVE_SUBJECTS = 1_000;

const digest = (value: string): Buffer => createHash("sha256").update(value).digest();

export function verifyAdvisorAccess(presentedToken: string): boolean {
  const expectedToken = process.env.TRACESHIFT_ADVISOR_ACCESS_TOKEN?.trim() ?? "";
  if (expectedToken.length < 20 || !presentedToken) return false;
  return timingSafeEqual(digest(expectedToken), digest(presentedToken));
}

export function advisorQuotaSubject(presentedToken: string): string {
  return digest(presentedToken).toString("hex");
}

export function consumeAdvisorQuota(subject: string, now = Date.now()): boolean {
  const configuredLimit = Number(process.env.TRACESHIFT_ADVISOR_RATE_LIMIT);
  const limit = Number.isSafeInteger(configuredLimit) && configuredLimit > 0
    ? configuredLimit
    : DEFAULT_LIMIT;
  const current = quotaWindows.get(subject);
  if (current && now - current.startedAt < WINDOW_MS) {
    if (current.requests >= limit) return false;
    current.requests += 1;
    return true;
  }

  if (current) quotaWindows.delete(subject);
  if (quotaWindows.size >= MAX_ACTIVE_SUBJECTS) {
    for (const [key, window] of quotaWindows) {
      if (now - window.startedAt >= WINDOW_MS) quotaWindows.delete(key);
    }
  }
  if (quotaWindows.size >= MAX_ACTIVE_SUBJECTS) return false;

  quotaWindows.set(subject, { startedAt: now, requests: 1 });
  return true;
}
