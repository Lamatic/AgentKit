import { recordOutputs, loadLatestRecording } from "./replay-store.js";
import type { RecordedFlowOutput } from "./replay-store.js";

let DAILY_BUDGET = Number(process.env.CRON_BUDGET_DAILY || "20");

let spentToday = 0;
let lastReset = new Date().toDateString();

function resetIfNeeded(): void {
  const today = new Date().toDateString();
  if (today !== lastReset) {
    spentToday = 0;
    lastReset = today;
  }
}

export function canSpend(amount: number): boolean {
  resetIfNeeded();
  return spentToday + amount <= DAILY_BUDGET;
}

export function recordSpend(amount: number): void {
  resetIfNeeded();
  spentToday += amount;
}

export function getBudgetStatus(): { spent: number; remaining: number; daily: number } {
  resetIfNeeded();
  return {
    spent: spentToday,
    remaining: Math.max(0, DAILY_BUDGET - spentToday),
    daily: DAILY_BUDGET,
  };
}

export function getMode(): "live" | "replay" {
  return canSpend(1) ? "live" : "replay";
}

export function setDailyBudget(amount: number): void {
  DAILY_BUDGET = amount;
  spentToday = 0;
  lastReset = new Date().toDateString();
}

export { recordOutputs, loadLatestRecording };
export type { RecordedFlowOutput };