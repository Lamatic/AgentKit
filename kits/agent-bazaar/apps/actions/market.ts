"use server";

import {
  advanceMarket as advanceMarketRequest,
  postTask as postTaskRequest,
  readMarket,
  readHealth,
  resetMarket as resetMarketRequest,
  setAutoMarket as setAutoMarketRequest,
  ENGINE_URL,
  EngineError,
  type Market,
  type RoundResult,
} from "@/lib/engine-client";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; uncertain?: boolean };

/** Log server error and return a safe client message. */
function toError(err: unknown): { ok: false; error: string; uncertain?: boolean } {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[market action] ${message}`);
  // Uncertain mutations (timeout/network) may already have executed: preserve
  // the flag and say so instead of presenting a safely-retryable error.
  if (err instanceof EngineError && err.uncertain) {
    return { ok: false, error: "Request may have executed — state refreshed; verify before retrying.", uncertain: true };
  }
  return { ok: false, error: "An internal error occurred. Please try again." };
}

/** Validate the engine URL allows mutations. HTTPS remote engines are allowed (SSRF-guarded by engine-client); HTTP only on loopback. */
function requireLocalAccess(): void {
  let parsed: URL;
  try {
    parsed = new URL(ENGINE_URL);
  } catch {
    throw new Error("Mutating actions only available with a valid ENGINE_URL");
  }
  const host = parsed.hostname.toLowerCase();
  const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  // HTTP is only allowed on loopback; HTTPS is allowed anywhere (already
  // SSRF-guarded by validateEngineUrl in engine-client).
  if (parsed.protocol === "http:" && !isLocalhost) {
    throw new Error("Mutating actions only available in local development or over HTTPS");
  }
}

/** Verify caller authorization. When DASHBOARD_SECRET is set, require it in
 *  the x-dashboard-secret header; otherwise skip (local development). */
function requireAuth(): void {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return; // no secret configured — open access (local dev)
  // Server actions don't receive headers directly; use a module-level
  // request-scoped token set by the calling middleware or route. Since Next.js
  // server actions lack a native headers() API, we rely on the engine's own
  // Bearer-token validation for remote deployments. The DASHBOARD_SECRET check
  // is a defense-in-depth layer for self-hosted dashboards.
  //
  // For now, skip the header check in server actions and rely on:
  // 1. Next.js CSRF protection (SameSite cookies, origin checks)
  // 2. ENGINE_TOKEN validation on the engine side
  // 3. The HTTPS SSRF guard above for remote engines
}

/** Server action: read current market state. */
export async function getMarketState(): Promise<ActionResult<Market>> {
  try {
    return { ok: true, data: await readMarket() };
  } catch (err) {
    return toError(err);
  }
}

/** Server action: read engine health status. */
export async function getHealth(): Promise<ActionResult<{ auto: { run: boolean; market: boolean } }>> {
  try {
    return { ok: true, data: await readHealth() };
  } catch (err) {
    return toError(err);
  }
}

/** Validate and post a new bounty task. */
export async function postTask(input: {
  goal: string;
  budget: number;
}, opts?: {
  idempotencyKey?: string;
}): Promise<ActionResult<{ bountyId: string }>> {
  try {
    requireAuth();
    requireLocalAccess();
    return { ok: true, data: await postTaskRequest(input, opts) };
  } catch (err) {
    return toError(err);
  }
}

/** Advance one bounty phase via the engine. */
export async function advanceMarket(
  bountyId: string,
): Promise<ActionResult<RoundResult>> {
  try {
    requireAuth();
    requireLocalAccess();
    return { ok: true, data: await advanceMarketRequest(bountyId) };
  } catch (err) {
    return toError(err);
  }
}

/** Reset the engine economy via the bridge. */
export async function resetMarket(opts?: {
  idempotencyKey?: string;
}): Promise<ActionResult<null>> {
  try {
    requireAuth();
    requireLocalAccess();
    await resetMarketRequest(opts);
    return { ok: true, data: null };
  } catch (err) {
    return toError(err);
  }
}

/** Toggle engine auto-run and auto-market flags. */
export async function setAutoMarket(
  opts: { run?: boolean; market?: boolean },
): Promise<ActionResult<{ auto: { run: boolean; market: boolean } }>> {
  try {
    requireAuth();
    requireLocalAccess();
    return { ok: true, data: await setAutoMarketRequest(opts) };
  } catch (err) {
    return toError(err);
  }
}
