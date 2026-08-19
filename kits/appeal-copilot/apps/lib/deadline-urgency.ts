export type UrgencyLevel = "critical" | "moderate" | "low" | "expired" | "unknown";

export interface DeadlineUrgency {
  daysRemaining: number | null;
  urgencyLevel: UrgencyLevel;
}

/**
 * Pure mirror of the Lamatic codeNode script at
 * ../../scripts/appeal-analysis_deadline-urgency.ts (that file runs inside Lamatic's
 * runtime and can't import from here — kept in sync manually, it's ~10 lines).
 * Used by the demo-mode example data so deadline countdowns stay relative to "today".
 */
export function computeDeadlineUrgency(deadline: string | null, referenceDate: Date = new Date()): DeadlineUrgency {
  if (!deadline) {
    return { daysRemaining: null, urgencyLevel: "unknown" };
  }

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    return { daysRemaining: null, urgencyLevel: "unknown" };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil((deadlineDate.getTime() - referenceDate.getTime()) / msPerDay);

  let urgencyLevel: UrgencyLevel;
  if (daysRemaining < 0) urgencyLevel = "expired";
  else if (daysRemaining <= 7) urgencyLevel = "critical";
  else if (daysRemaining <= 30) urgencyLevel = "moderate";
  else urgencyLevel = "low";

  return { daysRemaining, urgencyLevel };
}
