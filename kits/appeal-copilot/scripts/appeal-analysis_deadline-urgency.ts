// Code: Compute Deadline Urgency
// Flow: appeal-analysis
// Mirrors the pure function in apps/lib/deadline-urgency.ts (kept in sync manually —
// this file runs inside Lamatic's codeNode sandbox and cannot import from apps/).

const deadline = {{InstructorLLMNode_481.output.appealDeadline}};

let daysRemaining = null;
let urgencyLevel = "unknown";

// Reduces a value to midnight on its own calendar day. A date-only string like
// "2026-08-19" is parsed as UTC midnight, so comparing it against a wall-clock "now"
// made a deadline falling today read as expired at -1 days. Both sides are normalised
// to a calendar day so the result is a pure day difference.
function startOfDay(value) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const built = new Date(year, month - 1, day);
    // The Date constructor rolls overflow values forward instead of rejecting them, so an
    // extracted "2026-02-30" would silently become 2026-03-02 — two extra days of apparent
    // runway on a legal deadline. Round-trip the components and reject any drift.
    if (built.getFullYear() !== year || built.getMonth() !== month - 1 || built.getDate() !== day) {
      return null;
    }
    return built.getTime();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
}

if (deadline) {
  const deadlineMs = startOfDay(deadline);
  // An unparseable date yields null here; leaving daysRemaining null and urgencyLevel
  // "unknown" avoids the previous fall-through to "low", which reported false
  // reassurance on a real deadline.
  if (deadlineMs !== null) {
    const todayMs = startOfDay(new Date());
    const msPerDay = 1000 * 60 * 60 * 24;
    // Rounded, not ceiled: a DST transition makes the span between two local midnights
    // 23 or 25 hours, which would otherwise shift the count by a whole day.
    daysRemaining = Math.round((deadlineMs - todayMs) / msPerDay);

    if (daysRemaining < 0) urgencyLevel = "expired";
    else if (daysRemaining <= 7) urgencyLevel = "critical";
    else if (daysRemaining <= 30) urgencyLevel = "moderate";
    else urgencyLevel = "low";
  }
}

output = { daysRemaining, urgencyLevel };
