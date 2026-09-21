"use server";

import {
  advanceMarket as advanceMarketRequest,
  postTask as postTaskRequest,
  readMarket,
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

/** Mutating actions only run against a local engine companion process. */
function requireLocalAccess(): void {
  // Reuse the validated ENGINE_URL export (already SSRF-guarded at module
  // load); substring matching on the raw env is bypassable, so parse the
  // hostname and allow loopback only.
  let host: string;
  try {
    host = new URL(ENGINE_URL).hostname.toLowerCase();
  } catch {
    throw new Error("Mutating actions only available in local development");
  }
  if (host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]") {
    throw new Error("Mutating actions only available in local development");
  }
}

/** Server action: read current market state. */
export async function getMarketState(): Promise<ActionResult<Market>> {
  try {
    return { ok: true, data: await readMarket() };
  } catch (err) {
    return toError(err);
  }
}

/** Validate and post a new bounty task. */
export async function postTask(input: {
  goal: string;
  budget: number;
}): Promise<ActionResult<{ bountyId: string }>> {
  try {
    requireLocalAccess();
    return { ok: true, data: await postTaskRequest(input) };
  } catch (err) {
    return toError(err);
  }
}

/** Advance one bounty phase via the engine. */
export async function advanceMarket(
  bountyId: string,
): Promise<ActionResult<RoundResult>> {
  try {
    requireLocalAccess();
    return { ok: true, data: await advanceMarketRequest(bountyId) };
  } catch (err) {
    return toError(err);
  }
}

/** Reset the engine economy via the bridge. */
export async function resetMarket(): Promise<ActionResult<null>> {
  try {
    requireLocalAccess();
    await resetMarketRequest();
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
    requireLocalAccess();
    return { ok: true, data: await setAutoMarketRequest(opts) };
  } catch (err) {
    return toError(err);
  }
}
