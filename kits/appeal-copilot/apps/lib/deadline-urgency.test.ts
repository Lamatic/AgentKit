import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDeadlineUrgency } from "./deadline-urgency.ts";

const REF = new Date("2026-08-19T00:00:00Z");

test("null deadline is unknown urgency", () => {
  const result = computeDeadlineUrgency(null, REF);
  assert.equal(result.urgencyLevel, "unknown");
  assert.equal(result.daysRemaining, null);
});

test("unparseable deadline is unknown urgency", () => {
  const result = computeDeadlineUrgency("not-a-date", REF);
  assert.equal(result.urgencyLevel, "unknown");
});

test("deadline in the past is expired", () => {
  const result = computeDeadlineUrgency("2026-08-01", REF);
  assert.equal(result.urgencyLevel, "expired");
  assert.ok((result.daysRemaining ?? 0) < 0);
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
