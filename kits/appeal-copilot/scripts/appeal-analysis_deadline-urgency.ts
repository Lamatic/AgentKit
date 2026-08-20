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
  // A Date instance (used below for "today") is already a valid instant — reduce it
  // directly. It must not go through the string branch, whose ISO check would reject it.
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  }

  // ISO 8601 calendar date, with or without a trailing time/zone part. The extraction
  // node's contract is `YYYY-MM-DD` or ""; a full timestamp is accepted in case the
  // model appends one. The time part is matched in full rather than as `.*`: a permissive
  // tail let truncated junk like "2026-08-24T" or "2026-08-24T25:99" through as a valid
  // deadline, which on a legal filing window must read as unknown instead.
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|([+-]\d{2}):?(\d{2}))?)?$/.exec(String(value).trim());
  if (!iso) {
    // Deliberately no `new Date(value)` fallback: its lenient parsing rolls overflow
    // forward for non-ISO forms too ("2026/02/30" yields 2026-03-02) and those components
    // can't be recovered to validate. On a legal deadline an unusable value must read as
    // unknown rather than as extra runway.
    return null;
  }

  // The time part is discarded (only the calendar day matters), but out-of-range fields
  // still mean the extracted value is malformed, so reject rather than keep just the date.
  const over = (v, max) => v !== undefined && Math.abs(Number(v)) > max;
  if (over(iso[4], 23) || over(iso[5], 59) || over(iso[6], 59) || over(iso[7], 23) || over(iso[8], 59)) {
    return null;
  }

  const year = Number(iso[1]);
  const month = Number(iso[2]);
  const day = Number(iso[3]);
  const built = new Date(year, month - 1, day);
  // The Date constructor rolls overflow values forward instead of rejecting them, so an
  // extracted "2026-02-30" (or "2026-02-30T10:00:00") would silently become 2026-03-02 —
  // two extra days of apparent runway. Round-trip the components and reject any drift.
  if (built.getFullYear() !== year || built.getMonth() !== month - 1 || built.getDate() !== day) {
    return null;
  }
  return built.getTime();
}

if (deadline) {
  const deadlineMs = startOfDay(deadline);
  const todayMs = startOfDay(new Date());
  // An unparseable date yields null here; leaving daysRemaining null and urgencyLevel
  // "unknown" avoids the previous fall-through to "low", which reported false
  // reassurance on a real deadline. todayMs is checked too so a null can never reach the
  // subtraction, where it would coerce to 0 and yield a day count measured from 1970.
  if (deadlineMs !== null && todayMs !== null) {
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
