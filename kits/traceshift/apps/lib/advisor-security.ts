import { createHash, timingSafeEqual } from "node:crypto";

type QuotaWindow = { startedAt: number; requests: number };

const quotaWindows = new Map<string, QuotaWindow>();
const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 6;

const digest = (value: string): Buffer => createHash("sha256").update(value).digest();

export function verifyAdvisorAccess(presentedToken: string): boolean {
  const expectedToken = process.env.TRACESHIFT_ADVISOR_ACCESS_TOKEN?.trim() ?? "";
  if (expectedToken.length < 20 || !presentedToken) return false;
  return timingSafeEqual(digest(expectedToken), digest(presentedToken));
}

export function advisorQuotaSubject(presentedToken: string, clientAddress: string): string {
  return digest(`${presentedToken}\u0000${clientAddress}`).toString("hex");
}

export function consumeAdvisorQuota(subject: string, now = Date.now()): boolean {
  const configuredLimit = Number(process.env.TRACESHIFT_ADVISOR_RATE_LIMIT);
  const limit = Number.isSafeInteger(configuredLimit) && configuredLimit > 0
    ? configuredLimit
    : DEFAULT_LIMIT;
  if (quotaWindows.size > 1_000) {
    for (const [key, window] of quotaWindows) {
      if (now - window.startedAt >= WINDOW_MS) quotaWindows.delete(key);
    }
  }
  const current = quotaWindows.get(subject);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    quotaWindows.set(subject, { startedAt: now, requests: 1 });
    return true;
  }
  if (current.requests >= limit) return false;
  current.requests += 1;
  return true;
}
