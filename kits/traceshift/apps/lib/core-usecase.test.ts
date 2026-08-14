import assert from "node:assert/strict";
import test from "node:test";
import { isAdvisorCandidate } from "./advisor-contract";
import { analyzeTraceCsv } from "./analyze";
import {
  buildCacheBoundaryScript,
  buildOptimizationManifest,
  buildProposedFlowDiff,
} from "./artifacts";
import { generateDemoCsv } from "./demo-data";
import { demoFlowExport } from "./demo-flow";
import { mapFlowToReport, parseLamaticFlow } from "./flow-parser";

test("preserves the complete TraceShift proof-to-review use case", () => {
  const report = analyzeTraceCsv(generateDemoCsv());
  assert.equal(report.source.requests, 32);
  assert.deepEqual(report.source.workflowNames, ["Commerce Support Agent"]);
  assert.equal(report.metrics.successfulRuns, 29);
  assert.equal(report.metrics.failedRuns, 3);

  const cache = report.candidates.find(
    (candidate) => candidate.type === "exact-cache" && candidate.target === "Catalog Lookup",
  );
  assert.ok(cache);
  assert.equal(isAdvisorCandidate(cache), true);
  assert.equal(cache.backtest?.calls, 24);
  assert.equal(cache.backtest?.distinctKeys, 4);
  assert.equal(cache.backtest?.cacheHits, 20);
  assert.equal(cache.backtest?.outputMismatches, 0);
  assert.equal(cache.backtest?.latencySavedSeconds, 34.9);
  assert.equal(cache.backtest?.passed, true);

  const mapping = mapFlowToReport(parseLamaticFlow(demoFlowExport), report);
  assert.equal(
    mapping.nodes.find((node) => node.traceNodeName === "Catalog Lookup")?.id,
    "toolNode_catalog",
  );

  const manifest = buildOptimizationManifest(
    report,
    cache,
    mapping,
    "2026-08-13T00:00:00.000Z",
  );
  assert.equal(manifest.candidate.targetNodeId, "toolNode_catalog");
  assert.equal(manifest.backtest?.cacheHits, 20);
  assert.equal(manifest.importReady, false);
  assert.equal(manifest.approvalRequired, true);
  assert.match(buildProposedFlowDiff(manifest), /measuredReplayLatencySavedSeconds = 34\.9/);
  const cacheScript = buildCacheBoundaryScript(manifest) ?? "";
  assert.match(cacheScript, /reviewOnlyCacheBoundary/);
  assert.match(cacheScript, /invokeOriginal/);

  const serialized = JSON.stringify({ report, manifest });
  assert.equal(serialized.includes("Question 1"), false);
  assert.equal(serialized.includes("Grounded response"), false);
});
