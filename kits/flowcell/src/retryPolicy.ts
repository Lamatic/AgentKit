import type { FlowcellError, RetryConfig } from "./types";

// HTTP statuses worth retrying: rate limits, timeouts, upstream 5xx.
export const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Classify on transport/HTTP status FIRST. A 502 with a malformed body is
 * still a 502 (retryable). "Malformed JSON" is only non-retryable when the
 * HTTP layer itself succeeded (200 with a garbage payload) — retrying that
 * just pays for the same bad answer again.
 */
export function isRetryable(error: FlowcellError): boolean {
  // A present HTTP status is authoritative: retry iff it is in the table.
  // Message matching runs only for statusless (transport-level) errors, so a
  // non-retryable status like 400 is never overridden by its message text.
  if (error.httpStatus != null) {
    return RETRYABLE_STATUSES.has(error.httpStatus);
  }
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("timeout")) return true;
  if (msg.includes("econnreset")) return true;
  if (msg.includes("econnrefused")) return true;
  if (msg.includes("fetch failed")) return true;
  // 400/401/403/404/422, malformed JSON on a 200, schema failure,
  // bad config, budget exceeded → not retryable.
  return false;
}

/** Normalize an unknown thrown value into a FlowcellError. */
export function toFlowcellError(err: unknown): FlowcellError {
  if (err instanceof Error) {
    const httpStatus = (err as Error & { httpStatus?: unknown }).httpStatus;
    return {
      message: err.message,
      retryable: false,
      httpStatus: typeof httpStatus === "number" ? httpStatus : undefined,
    };
  }
  if (typeof err === "object" && err !== null) {
    const rec = err as Record<string, unknown>;
    const httpStatus = rec["httpStatus"] ?? rec["status"] ?? rec["statusCode"];
    return {
      message: typeof rec["message"] === "string" ? rec["message"] : String(err),
      retryable: false,
      httpStatus: typeof httpStatus === "number" ? httpStatus : undefined,
    };
  }
  return { message: String(err), retryable: false };
}

/**
 * Exponential backoff with optional jitter and Retry-After support.
 * `attempt` is 1-indexed (first retry waits ~baseDelayMs).
 */
export function computeDelay(
  attempt: number,
  config: RetryConfig,
  retryAfterMs?: number,
): number {
  const exponential = config.baseDelayMs * 2 ** Math.max(0, attempt - 1);
  const jittered = config.jitter
    ? exponential * (0.5 + Math.random() * 0.5)
    : exponential;
  const withRetryAfter =
    config.respectRetryAfter && retryAfterMs != null
      ? Math.max(jittered, retryAfterMs)
      : jittered;
  return Math.min(withRetryAfter, config.maxDelayMs);
}

/**
 * Parse a Retry-After header value (seconds) or response field into ms.
 * Returns undefined when absent/unparseable.
 */
export function parseRetryAfter(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const rec = err as Record<string, unknown>;
  // Explicit ms field wins and is taken verbatim.
  const msField = rec["retryAfterMs"];
  if (typeof msField === "number" && Number.isFinite(msField)) return msField;
  // Retry-After header / response field is in seconds (or an HTTP date).
  const raw =
    rec["retryAfter"] ??
    (rec["headers"] as Record<string, unknown> | undefined)?.["retry-after"];
  if (raw == null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw * 1000;
  if (typeof raw === "string") {
    const asNum = Number(raw);
    if (Number.isFinite(asNum)) return asNum * 1000; // header is in seconds
    const asDate = Date.parse(raw);
    if (!Number.isNaN(asDate)) return Math.max(0, asDate - Date.now());
  }
  return undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
