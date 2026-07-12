import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compareBaseline,
  type RunResult,
  type CaseResult,
} from "../actions/compareBaseline";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal CaseResult with sensible defaults. */
function makeCase(overrides: Partial<CaseResult> & { id: string }): CaseResult {
  return {
    passed: true,
    latencyMs: 500,
    similarity: 0.9,
    output: "some output",
    error: null,
    ...overrides,
  };
}

/** Create a minimal RunResult wrapping an array of cases. */
function makeRun(
  cases: CaseResult[],
  overrides?: Partial<Omit<RunResult, "cases">>
): RunResult {
  return {
    runId: "run-test",
    flowId: "flow-123",
    timestamp: new Date().toISOString(),
    ...overrides,
    cases,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("compareBaseline", () => {
  // ── 1. No baseline (first run) ──
  it("returns all cases as newCases when baseline is null", () => {
    const current = makeRun([
      makeCase({ id: "a" }),
      makeCase({ id: "b" }),
    ]);

    const result = compareBaseline(current, null);

    assert.deepStrictEqual(result.regressions, []);
    assert.deepStrictEqual(result.blockingRegressions, []);
    assert.deepStrictEqual(result.improvements, []);
    assert.deepStrictEqual(result.newCases, ["a", "b"]);
    assert.deepStrictEqual(result.removedCases, []);
    assert.equal(result.isFirstRun, true);
    assert.equal(
      result.note,
      "no baseline, this run becomes the baseline"
    );
  });

  // ── 2. Clean pass-through (no regressions, no improvements) ──
  it("reports no changes when current matches baseline within thresholds", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.9, passed: true }),
      makeCase({ id: "b", latencyMs: 600, similarity: 0.85, passed: true }),
    ]);
    const current = makeRun([
      // 50% slower — under the 60% threshold
      makeCase({ id: "a", latencyMs: 750, similarity: 0.9, passed: true }),
      // 0.05 drop — under the 0.1 threshold
      makeCase({ id: "b", latencyMs: 600, similarity: 0.80, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.deepStrictEqual(result.regressions, []);
    assert.deepStrictEqual(result.blockingRegressions, []);
    assert.deepStrictEqual(result.improvements, []);
    assert.deepStrictEqual(result.newCases, []);
    assert.deepStrictEqual(result.removedCases, []);
    assert.equal(result.isFirstRun, false);
    assert.equal(result.note, null);
  });

  // ── 3. Latency regression (above 60% threshold) ──
  it("flags latency regression when current > baseline × 1.60", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 1000, similarity: 0.9, passed: true }),
    ]);
    const current = makeRun([
      // 1610ms > 1000 × 1.60 = 1600 → regression
      makeCase({ id: "a", latencyMs: 1610, similarity: 0.9, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.regressions.length, 1);
    assert.equal(result.regressions[0].id, "a");
    assert.equal(result.regressions[0].latency.regressed, true);
    assert.equal(result.regressions[0].latency.baseline, 1000);
    assert.equal(result.regressions[0].latency.current, 1610);
    // Similarity should not be flagged
    assert.equal(result.regressions[0].similarity?.regressed, false);
    assert.equal(result.regressions[0].passChange, "unchanged");
  });

  // ── 3b. Latency regression does NOT block baseline ──
  it("latency-only regression is NOT a blocking regression", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 1000, similarity: 0.9, passed: true }),
    ]);
    const current = makeRun([
      // 1610ms > 1600 threshold → latency regression, but correctness is fine
      makeCase({ id: "a", latencyMs: 1610, similarity: 0.9, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    // Should appear in regressions (informational)
    assert.equal(result.regressions.length, 1);
    // Should NOT appear in blockingRegressions
    assert.equal(result.blockingRegressions.length, 0);
  });

  // ── 3c. 50% latency increase is NOT a regression (under 60% threshold) ──
  it("does not flag latency regression when increase is under 60%", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 1000, similarity: 0.9, passed: true }),
    ]);
    const current = makeRun([
      // 1500ms = 50% increase, under 60% threshold → NOT a regression
      makeCase({ id: "a", latencyMs: 1500, similarity: 0.9, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.regressions.length, 0);
    assert.equal(result.blockingRegressions.length, 0);
  });

  // ── 4. Similarity regression ──
  it("flags similarity regression when drop > 0.2", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.95, passed: true }),
    ]);
    const current = makeRun([
      // 0.95 - 0.70 = 0.25 > 0.2 → regression
      makeCase({ id: "a", latencyMs: 500, similarity: 0.70, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.regressions.length, 1);
    assert.equal(result.regressions[0].id, "a");
    assert.equal(result.regressions[0].similarity?.regressed, true);
    assert.equal(result.regressions[0].similarity?.baseline, 0.95);
    assert.equal(result.regressions[0].similarity?.current, 0.70);
    // Latency should not be flagged
    assert.equal(result.regressions[0].latency.regressed, false);
    assert.equal(result.regressions[0].passChange, "unchanged");
  });

  // ── 4b. Similarity regression IS a blocking regression ──
  it("similarity regression IS a blocking regression", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.95, passed: true }),
    ]);
    const current = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.70, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.blockingRegressions.length, 1);
    assert.equal(result.blockingRegressions[0].id, "a");
    assert.equal(result.blockingRegressions[0].similarity?.regressed, true);
  });

  // ── 4c. Minor similarity drop is NOT a regression (under 0.2 threshold) ──
  it("does not flag similarity regression when drop is under 0.2", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.95, passed: true }),
    ]);
    const current = makeRun([
      // 0.95 - 0.80 = 0.15 < 0.2 → NOT a regression
      makeCase({ id: "a", latencyMs: 500, similarity: 0.80, passed: true }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.regressions.length, 0);
    assert.equal(result.blockingRegressions.length, 0);
  });

  // ── 5. New failure ──
  it("flags new_failure when baseline passed but current failed", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.9, passed: true }),
      makeCase({ id: "b", latencyMs: 600, similarity: 0.85, passed: true }),
    ]);
    const current = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.9, passed: true }),
      // Case "b" now fails — should always be flagged regardless of thresholds
      makeCase({ id: "b", latencyMs: 600, similarity: 0.85, passed: false }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.regressions.length, 1);
    assert.equal(result.regressions[0].id, "b");
    assert.equal(result.regressions[0].passChange, "new_failure");
    // Latency and similarity are unchanged — only the pass/fail flip matters
    assert.equal(result.regressions[0].latency.regressed, false);
    assert.equal(result.regressions[0].similarity?.regressed, false);
  });

  // ── 5b. New failure IS a blocking regression ──
  it("new_failure IS a blocking regression", () => {
    const baseline = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.9, passed: true }),
    ]);
    const current = makeRun([
      makeCase({ id: "a", latencyMs: 500, similarity: 0.9, passed: false }),
    ]);

    const result = compareBaseline(current, baseline);

    assert.equal(result.blockingRegressions.length, 1);
    assert.equal(result.blockingRegressions[0].id, "a");
    assert.equal(result.blockingRegressions[0].passChange, "new_failure");
  });
});
