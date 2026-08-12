import assert from "node:assert/strict";
import test from "node:test";
import { analyzeTraceCsv } from "./analyze";
import { backtestExactCache, scoreConfidence, wilsonLowerBound } from "./backtest";
import { generateDemoCsv } from "./demo-data";

test("chronologically replays exact-input cache hits", () => {
  const report = analyzeTraceCsv(generateDemoCsv());
  const replay = backtestExactCache(report, "Catalog Lookup");
  assert.equal(replay.calls, 24);
  assert.equal(replay.distinctKeys, 4);
  assert.equal(replay.cacheHits, 20);
  assert.equal(replay.outputMismatches, 0);
});

test("measures replay savings instead of applying a percentage scenario", () => {
  const replay = backtestExactCache(analyzeTraceCsv(generateDemoCsv()), "Catalog Lookup");
  assert.equal(replay.baselineLatencySeconds, 42);
  assert.equal(replay.replayLatencySeconds, 7.1);
  assert.equal(replay.latencySavedSeconds, 34.9);
  assert.equal(replay.passed, true);
});

test("fails a cache backtest when repeated outputs differ", () => {
  const csv = generateDemoCsv().replace(
    '"{""product"":""sku-A"",""stock"":18,""currency"":""USD""}"',
    '"{""product"":""sku-A"",""stock"":99,""currency"":""USD""}"',
  );
  const replay = backtestExactCache(analyzeTraceCsv(csv), "Catalog Lookup");
  assert.ok(replay.outputMismatches > 0);
  assert.equal(replay.passed, false);
});

test("returns no savings for a node with unique inputs", () => {
  const replay = backtestExactCache(analyzeTraceCsv(generateDemoCsv()), "Draft Answer");
  assert.equal(replay.cacheHits, 0);
  assert.equal(replay.latencySavedSeconds, 0);
});

test("Wilson lower bound becomes more conservative for small samples", () => {
  assert.ok(wilsonLowerBound(9, 10) < wilsonLowerBound(90, 100));
  assert.equal(wilsonLowerBound(0, 0), 0);
});

test("confidence records blockers instead of hiding weak evidence", () => {
  const report = analyzeTraceCsv(generateDemoCsv());
  const confidence = scoreConfidence({
    sampleSize: 3,
    recurringObservations: 2,
    totalRuns: 3,
    stableObservations: 2,
    stabilityTotal: 3,
    dataQuality: report.dataQuality,
  });
  assert.equal(confidence.level, "low");
  assert.ok(confidence.blockers.some((blocker) => blocker.includes("five")));
});
