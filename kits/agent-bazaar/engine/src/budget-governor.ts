import { supabase } from "./supabase.js";
import { recordOutputs, loadLatestRecording } from "./replay-store.js";
import type { RecordedFlowOutput } from "./replay-store.js";

const _rawBudget = Number(process.env.CRON_BUDGET_DAILY);
let DAILY_BUDGET = Number.isFinite(_rawBudget) && _rawBudget >= 0 ? _rawBudget : 20;

let spentToday = 0;
let lastReset = new Date().toDateString();

/** resetIfNeeded helper. */
function resetIfNeeded(): void {
  const today = new Date().toDateString();
  if (today !== lastReset) {
    spentToday = 0;
    lastReset = today;
  }
}

/** Check whether the daily LLM budget allows spending. */
export function canSpend(amount: number): boolean {
  resetIfNeeded();
  return spentToday + amount <= DAILY_BUDGET;
}

/** Record LLM spend against the daily budget. */
export async function recordSpend(amount: number): Promise<void> {
  resetIfNeeded();
  try {
    const { error } = await supabase.rpc("spend_budget", { p_day: budgetDay(), p_amount: amount });
    if (error) throw error;
  } catch (err) {
    console.error(`[budget] durable spend unreachable: ${(err as Error).message}`);
  }
  spentToday += amount;
}

/** Budget date key shared with the durable daily_budget table. */
function budgetDay(): string {
  return new Date().toDateString();
}

/**
 * Atomically reserve budget in shared durable storage (check and increment
 * in one statement, so restarts and concurrent engine instances cannot
 * overspend). Falls back to the in-memory snapshot when the database is
 * unreachable. Returns false when exhausted.
 */
export async function tryReserve(amount: number): Promise<boolean> {
  resetIfNeeded();
  let durable: boolean | null;
  try {
    const { data, error } = await supabase.rpc("reserve_budget", {
      p_day: budgetDay(),
      p_amount: amount,
      p_cap: DAILY_BUDGET,
    });
    if (error) throw error;
    durable = data === true;
  } catch (err) {
    console.error(`[budget] durable reserve unreachable, using in-memory snapshot: ${(err as Error).message}`);
    durable = null;
  }
  if (durable !== null) {
    if (durable) spentToday += amount;
    return durable;
  }
  if (spentToday + amount > DAILY_BUDGET) return false;
  spentToday += amount;
  return true;
}

/** Release a reservation made by tryReserve. */
export async function release(amount: number): Promise<void> {
  resetIfNeeded();
  try {
    const { error } = await supabase.rpc("release_budget", { p_day: budgetDay(), p_amount: amount });
    if (error) throw error;
  } catch (err) {
    console.error(`[budget] durable release unreachable: ${(err as Error).message}`);
  }
  spentToday = Math.max(0, spentToday - amount);
}

/** Return current daily budget spend and remaining. */
export function getBudgetStatus(): { spent: number; remaining: number; daily: number } {
  resetIfNeeded();
  return {
    spent: spentToday,
    remaining: Math.max(0, DAILY_BUDGET - spentToday),
    daily: DAILY_BUDGET,
  };
}

/** Return live or replay mode based on budget. */
export function getMode(): "live" | "replay" {
  return canSpend(1) ? "live" : "replay";
}

/** Update the daily LLM budget cap. */
export function setDailyBudget(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0) return;
  DAILY_BUDGET = amount;
}

export { recordOutputs, loadLatestRecording };
export type { RecordedFlowOutput };