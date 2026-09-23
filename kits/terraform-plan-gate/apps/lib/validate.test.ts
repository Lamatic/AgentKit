import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateReviewResult } from "./validate";

// A real response from the deployed tf-plan-review flow for samples/risky-plan.json.
const golden = () => JSON.parse(readFileSync(join(__dirname, "fixtures", "review-response.json"), "utf8"));

test("a real flow response passes and keeps its shape", () => {
  const r = validateReviewResult(golden());
  assert.equal(r.verdict, "block");
  assert.equal(r.changes.length, r.totalChanges);
  assert.ok(r.counts.critical >= 1);
  assert.ok(r.changes.every((c) => typeof c.address === "string" && Array.isArray(c.actions)));
  assert.ok(r.changes.some((c) => c.policyIds.length > 0), "at least one change cites a policy");
  assert.ok(typeof r.reviewComment === "string" && r.reviewComment.includes("### Findings"));
  assert.equal(typeof r.droppedAssessments, "number");
});

test("the result envelope is unwrapped by the caller, so a bare wrapper is rejected", () => {
  assert.throws(() => validateReviewResult({ result: golden() }), /unknown verdict/);
});

test("an unknown verdict is rejected", () => {
  assert.throws(() => validateReviewResult({ ...golden(), verdict: "maybe" }), /unknown verdict/);
});

test("malformed counts are rejected", () => {
  assert.throws(() => validateReviewResult({ ...golden(), counts: { critical: -1 } }), /malformed counts/);
  assert.throws(() => validateReviewResult({ ...golden(), counts: null }), /malformed counts/);
});

test("a change without an address or actions is rejected, not rendered half-shaped", () => {
  const g = golden();
  assert.throws(() => validateReviewResult({ ...g, changes: [{ risk: "high" }] }), /has no address/);
  assert.throws(() => validateReviewResult({ ...g, changes: [{ address: "aws_x.y", actions: "delete" }] }), /no actions array/);
});

test("a mismatch between totalChanges and changes is rejected", () => {
  const g = golden();
  assert.throws(() => validateReviewResult({ ...g, totalChanges: g.changes.length + 1 }), /reported .* changes but returned/);
});

test("a verdict that contradicts its own changes is rejected", () => {
  const g = golden();
  assert.throws(() => validateReviewResult({ ...g, verdict: "allow" }), /returned verdict "allow" but its changes require "block"/);
  assert.throws(() => validateReviewResult({ ...g, verdict: "needs-approval" }), /require "block"/);
  const lowOnly = { ...g, verdict: "block", totalChanges: 1, counts: { critical: 0, high: 0, medium: 0, low: 1, unclassified: 0 }, changes: [{ address: "aws_x.y", actions: ["update"], risk: "low" }] };
  assert.throws(() => validateReviewResult(lowOnly), /require "allow"/);
  assert.equal(validateReviewResult({ ...lowOnly, verdict: "allow" }).verdict, "allow");
});

test("counts that disagree with the changes are rejected", () => {
  const g = golden();
  assert.throws(() => validateReviewResult({ ...g, counts: { ...g.counts, critical: 0, low: g.counts.low + 1 } }), /reported 0 critical change\(s\) but its changes contain \d+/);
});

test("unknown risk labels become unclassified and optional fields are normalised", () => {
  const g = golden();
  const r = validateReviewResult({
    ...g,
    verdict: "needs-approval",
    totalChanges: 1,
    counts: { critical: 0, high: 0, medium: 0, low: 0, unclassified: 1 },
    changes: [{ address: "aws_x.y", actions: ["update"], risk: "severe", confidence: "high", policyIds: "POL-01" }],
    reviewComment: 42,
    policiesConsulted: [{ policyId: 7 }],
  });
  assert.equal(r.changes[0].risk, "unclassified");
  assert.equal(r.changes[0].confidence, null);
  assert.deepEqual(r.changes[0].policyIds, []);
  assert.equal(r.changes[0].type, "unknown");
  assert.equal(r.reviewComment, null);
  assert.deepEqual(r.policiesConsulted, [{ policyId: null, title: null, certainty: null, minimumRisk: null }]);
  assert.equal(r.changes[0].policyFloor, null);
  assert.equal(r.droppedAssessments, 0);
});

test("droppedAssessments must be a non-negative integer when present", () => {
  const g = golden();
  assert.throws(() => validateReviewResult({ ...g, droppedAssessments: -1 }), /malformed droppedAssessments/);
  assert.throws(() => validateReviewResult({ ...g, droppedAssessments: 1.5 }), /malformed droppedAssessments/);
  assert.throws(() => validateReviewResult({ ...g, droppedAssessments: "1" }), /malformed droppedAssessments/);
  assert.equal(validateReviewResult({ ...g, droppedAssessments: 2 }).droppedAssessments, 2);
  assert.throws(() => validateReviewResult({ ...g, invalidFacts: -2 }), /malformed invalidFacts/);
  assert.equal(validateReviewResult({ ...g, invalidFacts: undefined }).invalidFacts, 0);
});

test("invalid facts must appear as unclassified changes, never only as a number", () => {
  const g = golden();
  assert.throws(() => validateReviewResult({ ...g, invalidFacts: 1 }), /1 invalid fact\(s\) but only 0 unclassified/);
  const empty = { ...g, verdict: "no-changes", totalChanges: 0, counts: { critical: 0, high: 0, medium: 0, low: 0, unclassified: 0 }, changes: [], invalidFacts: 1 };
  assert.throws(() => validateReviewResult(empty), /invalid fact/);
  const materialised = { ...g, verdict: "needs-approval", totalChanges: 1, counts: { critical: 0, high: 0, medium: 0, low: 0, unclassified: 1 }, changes: [{ address: "invalid-fact-1", actions: [], risk: "unclassified" }], invalidFacts: 1 };
  assert.equal(validateReviewResult(materialised).verdict, "needs-approval");
});
