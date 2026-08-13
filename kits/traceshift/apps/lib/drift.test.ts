import assert from "node:assert/strict";
import test from "node:test";
import { analyzeTraceCsv } from "./analyze";
import { generateDemoCsv, generateDriftedDemoCsv } from "./demo-data";
import { compareTraceWindows } from "./drift";

test("detects p50 and p95 latency regression between windows", () => {
  const drift = compareTraceWindows(
    analyzeTraceCsv(generateDemoCsv()),
    analyzeTraceCsv(generateDriftedDemoCsv()),
  );
  assert.equal(drift.metrics.find((item) => item.name === "p95 latency")?.direction, "regressed");
  assert.ok(drift.signals.some((signal) => signal.kind === "latency"));
});

test("detects per-run cost regression", () => {
  const drift = compareTraceWindows(
    analyzeTraceCsv(generateDemoCsv()),
    analyzeTraceCsv(generateDriftedDemoCsv()),
  );
  assert.equal(drift.metrics.find((item) => item.name === "cost per successful run")?.direction, "regressed");
});

test("identical windows produce no regression signals", () => {
  const report = analyzeTraceCsv(generateDemoCsv());
  const drift = compareTraceWindows(report, report);
  assert.equal(drift.metrics.every((item) => item.direction === "unchanged"), true);
  assert.equal(drift.signals.length, 0);
});

test("reports node-level latency drift", () => {
  const drift = compareTraceWindows(
    analyzeTraceCsv(generateDemoCsv()),
    analyzeTraceCsv(generateDriftedDemoCsv()),
  );
  assert.ok(drift.signals.some((signal) => signal.kind === "node" && signal.title.includes("Draft Answer")));
});

test("preserves path comparison even when paths do not change", () => {
  const drift = compareTraceWindows(
    analyzeTraceCsv(generateDemoCsv()),
    analyzeTraceCsv(generateDriftedDemoCsv()),
  );
  assert.equal(drift.newPaths.length, 0);
  assert.equal(drift.removedPaths.length, 0);
  assert.ok(drift.pathShareChanges.length > 0);
});

test("reports paths that disappear from the current window", () => {
  const baseline = analyzeTraceCsv(generateDemoCsv());
  const current = analyzeTraceCsv(generateDemoCsv());
  const removed = current.paths[0].signature;
  current.paths = current.paths.slice(1);

  assert.ok(compareTraceWindows(baseline, current).removedPaths.includes(removed));
});

test("signals a material loss of cost evidence coverage", () => {
  const baseline = analyzeTraceCsv(generateDemoCsv());
  const current = analyzeTraceCsv(generateDemoCsv());
  current.dataQuality = { ...current.dataQuality, costCoverage: 0 };

  const drift = compareTraceWindows(baseline, current);
  assert.ok(drift.signals.some((signal) => signal.id === "coverage-cost"));
});
