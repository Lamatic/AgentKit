export type UrgencyLevel = "critical" | "moderate" | "low" | "expired" | "unknown";

export interface DeadlineUrgency {
  daysRemaining: number | null;
  urgencyLevel: UrgencyLevel;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Midnight-local for a date, as epoch ms.
 *
 * `new Date("2026-08-19")` parses a date-only string as **UTC** midnight, so for anyone
 * behind UTC it lands on the previous local calendar day. Comparing that against a
 * wall-clock "now" made a deadline falling today read as expired. Both sides are
 * normalised to a local calendar day so the count is a pure day difference.
 */
function startOfLocalDay(value: string | Date): number | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  }

  // Matches an ISO 8601 calendar date, with or without a trailing time/zone part. The
  // extraction node's contract is `YYYY-MM-DD` or "" (see
  // prompts/appeal-analysis_extract-classify_system.md), and a full timestamp is accepted
  // in case the model appends one.
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(value.trim());
  if (!iso) {
    // Deliberately not falling back to `new Date(value)`: its lenient parsing rolls
    // overflow forward for non-ISO forms too ("2026/02/30" and "February 30, 2026" both
    // yield 2026-03-02), and those components can't be recovered to validate. On a legal
    // deadline an unusable value must read as unknown rather than as extra runway.
    return null;
  }

  const year = Number(iso[1]);
  const month = Number(iso[2]);
  const day = Number(iso[3]);
  const built = new Date(year, month - 1, day);
  // The Date constructor rolls overflow values forward rather than rejecting them, so
  // "2026-02-30" (and "2026-02-30T10:00:00") would silently become 2026-03-02 — two extra
  // days of apparent runway. Round-trip the components and treat any drift as unparseable.
  if (built.getFullYear() !== year || built.getMonth() !== month - 1 || built.getDate() !== day) {
    return null;
  }
  return built.getTime();
}

/**
 * Pure mirror of the Lamatic codeNode script at
 * ../../scripts/appeal-analysis_deadline-urgency.ts (that file runs inside Lamatic's
 * runtime and can't import from here — kept in sync manually).
 * Used by the demo-mode example data so deadline countdowns stay relative to "today".
 */
export function computeDeadlineUrgency(
  deadline: string | null,
  referenceDate: Date = new Date()
): DeadlineUrgency {
  if (!deadline) {
    return { daysRemaining: null, urgencyLevel: "unknown" };
  }

  const deadlineMs = startOfLocalDay(deadline);
  const todayMs = startOfLocalDay(referenceDate);
  if (deadlineMs === null || todayMs === null) {
    return { daysRemaining: null, urgencyLevel: "unknown" };
  }

  // Rounded, not ceiled: a DST transition makes the span between two local midnights 23
  // or 25 hours, which would otherwise round a whole day off the count.
  const daysRemaining = Math.round((deadlineMs - todayMs) / MS_PER_DAY);

  let urgencyLevel: UrgencyLevel;
  if (daysRemaining < 0) urgencyLevel = "expired";
  else if (daysRemaining <= 7) urgencyLevel = "critical";
  else if (daysRemaining <= 30) urgencyLevel = "moderate";
  else urgencyLevel = "low";

  return { daysRemaining, urgencyLevel };
}
