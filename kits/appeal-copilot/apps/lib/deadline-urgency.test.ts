import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDeadlineUrgency } from "./deadline-urgency.ts";

// Local midnight, not `new Date("...Z")`: a UTC reference resolves to the *previous*
// calendar day west of Greenwich, which would make these assertions depend on the
// machine's timezone. Every case below holds in any TZ.
const REF = new Date(2026, 7, 19); // 2026-08-19, local

test("null deadline is unknown urgency", () => {
  const result = computeDeadlineUrgency(null, REF);
  assert.equal(result.urgencyLevel, "unknown");
  assert.equal(result.daysRemaining, null);
});

test("unparseable deadline is unknown urgency", () => {
  const result = computeDeadlineUrgency("not-a-date", REF);
  assert.equal(result.urgencyLevel, "unknown");
  assert.equal(result.daysRemaining, null);
});

test("deadline in the past is expired", () => {
  const result = computeDeadlineUrgency("2026-08-01", REF);
  assert.equal(result.urgencyLevel, "expired");
  assert.equal(result.daysRemaining, -18);
});

test("deadline within 7 days is critical", () => {
  const result = computeDeadlineUrgency("2026-08-24", REF);
  assert.equal(result.urgencyLevel, "critical");
  assert.equal(result.daysRemaining, 5);
});

test("deadline within 30 days is moderate", () => {
  const result = computeDeadlineUrgency("2026-09-10", REF);
  assert.equal(result.urgencyLevel, "moderate");
});

test("deadline beyond 30 days is low", () => {
  const result = computeDeadlineUrgency("2026-12-01", REF);
  assert.equal(result.urgencyLevel, "low");
});

// Regression: a date-only deadline was parsed as UTC midnight and compared against a
// wall-clock reference, so late in the day west of Greenwich a deadline falling *today*
// reported as expired at -1 days — telling someone a live appeal window had closed.
test("deadline falling today is not expired, regardless of time of day", () => {
  for (const hour of [0, 12, 20, 23]) {
    const ref = new Date(2026, 7, 19, hour, 30);
    const result = computeDeadlineUrgency("2026-08-19", ref);
    assert.equal(result.daysRemaining, 0, `hour ${hour}`);
    assert.equal(result.urgencyLevel, "critical", `hour ${hour}`);
  }
});

test("time of day never shifts the day count", () => {
  for (const hour of [0, 12, 20, 23]) {
    const ref = new Date(2026, 7, 19, hour, 30);
    assert.equal(computeDeadlineUrgency("2026-08-29", ref).daysRemaining, 10, `hour ${hour}`);
  }
});

// Spring-forward (2026-03-08 in US zones) makes the span between two local midnights 23
// hours, which a ceil-based count would round up into an extra day.
test("a DST transition does not distort the day count", () => {
  const ref = new Date(2026, 2, 6); // 2026-03-06, local
  assert.equal(computeDeadlineUrgency("2026-03-13", ref).daysRemaining, 7);
});

test("a full timestamp is reduced to its local calendar day", () => {
  const result = computeDeadlineUrgency("2026-08-24T13:45:00", new Date(2026, 7, 19, 22));
  assert.equal(result.daysRemaining, 5);
});

// Regression: the Date constructor rolls overflow components forward rather than
// rejecting them, so "2026-02-30" became 2026-03-02 — reporting two more days of runway
// than the stated deadline actually allows.
test("an impossible calendar date is unknown, not rolled forward", () => {
  for (const bad of [
    "2026-02-30", // February never has 30 days
    "2026-02-29", // 2026 is not a leap year
    "2026-04-31", // April has 30
    "2026-13-01", // month out of range
    "2026-00-10", // month zero
    "2026-06-00", // day zero
    "2026-06-32", // day out of range
  ]) {
    const result = computeDeadlineUrgency(bad, REF);
    assert.equal(result.urgencyLevel, "unknown", bad);
    assert.equal(result.daysRemaining, null, bad);
  }
});

test("real calendar dates near the overflow boundaries still parse", () => {
  assert.equal(computeDeadlineUrgency("2026-02-28", new Date(2026, 1, 26)).daysRemaining, 2);
  assert.equal(computeDeadlineUrgency("2024-02-29", new Date(2024, 1, 27)).daysRemaining, 2); // leap year
  assert.equal(computeDeadlineUrgency("2026-12-31", new Date(2026, 11, 30)).daysRemaining, 1);
  assert.equal(computeDeadlineUrgency("2026-01-01", new Date(2025, 11, 31)).daysRemaining, 1);
});

// Regression: overflow validation originally guarded only the date-only branch, so a
// timestamped deadline bypassed it — "2026-02-30T10:00:00" still resolved to 2026-03-02.
test("an impossible date is unknown even with a time component", () => {
  for (const bad of [
    "2026-02-30T10:00:00",
    "2026-02-30T10:00:00Z",
    "2026-02-30 10:00:00",
    "2026-02-29T00:00:00", // 2026 is not a leap year
    "2026-04-31T23:59:59",
    "2026-06-32T10:00:00",
    "2026-13-01T10:00:00",
  ]) {
    const result = computeDeadlineUrgency(bad, REF);
    assert.equal(result.urgencyLevel, "unknown", bad);
    assert.equal(result.daysRemaining, null, bad);
  }
});

test("valid timestamped deadlines still resolve to their calendar day", () => {
  for (const good of [
    "2026-08-24T00:00:00",
    "2026-08-24T13:45:00",
    "2026-08-24T23:59:59Z",
    "2026-08-24 13:45:00",
    "2026-08-24T13:45",
    "2026-08-24T13:45:00.123Z",
    "2026-08-24T13:45:00+05:30",
    "2026-08-24T13:45:00-0800",
  ]) {
    assert.equal(computeDeadlineUrgency(good, REF).daysRemaining, 5, good);
  }
});

// Regression: the time part was matched as `.*`, so anything after a valid date passed —
// a truncated or nonsensical timestamp yielded a confident countdown off the date alone.
test("a malformed time or offset is unknown, not silently dropped", () => {
  for (const bad of [
    "2026-08-24T",
    "2026-08-24T25:99",
    "2026-08-24Tnot-a-time",
    "2026-08-24T13",
    "2026-08-24T13:45:60",
    "2026-08-24T24:00:00",
    "2026-08-24T13:45:00+24:00",
    "2026-08-24T13:45:00+05:99",
    "2026-08-24T13:45:00 maybe",
  ]) {
    const result = computeDeadlineUrgency(bad, REF);
    assert.equal(result.urgencyLevel, "unknown", bad);
    assert.equal(result.daysRemaining, null, bad);
  }
});

// A format whose components cannot be recovered for validation is treated as unknown
// rather than trusted: the lenient parser rolls these forward too ("2026/02/30" and
// "February 30, 2026" both yield 2026-03-02), which would overstate the time remaining.
test("non-ISO date formats are unknown rather than leniently parsed", () => {
  for (const odd of ["2026/02/30", "February 30, 2026", "August 24, 2026", "24-08-2026", "N/A"]) {
    const result = computeDeadlineUrgency(odd, REF);
    assert.equal(result.urgencyLevel, "unknown", odd);
    assert.equal(result.daysRemaining, null, odd);
  }
});
