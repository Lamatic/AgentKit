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
export function recordSpend(amount: number): void {
  resetIfNeeded();
  spentToday += amount;
}

/**
 * Atomically reserve budget before an external attempt begins (check and
 * increment in one synchronous step, so concurrent rounds cannot both pass
 * a canSpend check and overspend). Returns false when exhausted — the caller
 * proceeds on fallbacks without recording. Release only when the attempt did
 * not consume budget (e.g. it threw before the flow ran).
 */
export function tryReserve(amount: number): boolean {
  resetIfNeeded();
  if (spentToday + amount > DAILY_BUDGET) return false;
  spentToday += amount;
  return true;
}

/** Release a reservation made by tryReserve. */
export function release(amount: number): void {
  resetIfNeeded();
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