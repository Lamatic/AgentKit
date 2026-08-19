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
