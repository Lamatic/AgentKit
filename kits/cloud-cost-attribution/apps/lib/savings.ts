import type { SavingsKey } from "./types";

// Single source of truth for SavingsKey → multiplier.
export const SAVINGS_MULTIPLIER: Record<SavingsKey, number> = {
  "eliminate-full": 1.0,
  "reduce-major": 0.7,
  "reduce-partial": 0.4,
  "reduce-minor": 0.15,
  "one-time-only": 0.0,
  unknown: 0.0,
};

const VALID_KEYS = new Set<SavingsKey>(Object.keys(SAVINGS_MULTIPLIER) as SavingsKey[]);

/** Coerces an unvalidated LLM-emitted savingsKey to a known key, flagging if invalid. */
export function coerceSavingsKey(key: string): { key: SavingsKey; flagged: boolean } {
  if (VALID_KEYS.has(key as SavingsKey)) return { key: key as SavingsKey, flagged: false };
  return { key: "unknown", flagged: true };
}

/** Deterministic savings computation — the only place a dollar savings figure is produced. */
export function computeEstimatedMonthlySavings(deltaAbsWeekly: number, savingsKey: SavingsKey): number {
  const monthlyDelta = deltaAbsWeekly * (30 / 7);
  return Math.round(monthlyDelta * SAVINGS_MULTIPLIER[savingsKey] * 100) / 100;
}
