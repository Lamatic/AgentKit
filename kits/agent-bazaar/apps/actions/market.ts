"use server";

import {
  advanceMarket as advanceMarketRequest,
  postTask as postTaskRequest,
  readMarket,
  resetMarket as resetMarketRequest,
  setAutoMarket as setAutoMarketRequest,
  type Market,
  type RoundResult,
} from "@/lib/engine-client";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toError(err: unknown): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : String(err) };
}

export async function getMarketState(): Promise<ActionResult<Market>> {
  try {
    return { ok: true, data: await readMarket() };
  } catch (err) {
    return toError(err);
  }
}

export async function postTask(input: {
  goal: string;
  budget: number;
}): Promise<ActionResult<{ bountyId: string }>> {
  try {
    return { ok: true, data: await postTaskRequest(input) };
  } catch (err) {
    return toError(err);
  }
}

export async function advanceMarket(
  bountyId: string,
): Promise<ActionResult<RoundResult>> {
  try {
    return { ok: true, data: await advanceMarketRequest(bountyId) };
  } catch (err) {
    return toError(err);
  }
}

export async function resetMarket(): Promise<ActionResult<null>> {
  try {
    await resetMarketRequest();
    return { ok: true, data: null };
  } catch (err) {
    return toError(err);
  }
}

export async function setAutoMarket(
  opts: { run?: boolean; market?: boolean },
): Promise<ActionResult<{ auto: { run: boolean; market: boolean } }>> {
  try {
    return { ok: true, data: await setAutoMarketRequest(opts) };
  } catch (err) {
    return toError(err);
  }
}
