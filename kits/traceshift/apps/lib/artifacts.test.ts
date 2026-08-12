import assert from "node:assert/strict";
import test from "node:test";
import { analyzeTraceCsv } from "./analyze";
import {
  buildCacheBoundaryScript,
  buildOptimizationManifest,
  buildProposedFlowDiff,
} from "./artifacts";
import { demoFlowExport } from "./demo-flow";
import { generateDemoCsv } from "./demo-data";
import { mapFlowToReport, parseLamaticFlow } from "./flow-parser";

const fixture = () => {
  const report = analyzeTraceCsv(generateDemoCsv());
  const candidate = report.candidates.find((item) => item.type === "exact-cache")!;
  const mapping = mapFlowToReport(parseLamaticFlow(demoFlowExport), report);
  return { report, candidate, mapping };
};

test("builds a versioned optimization manifest tied to a real node ID", () => {
  const { report, candidate, mapping } = fixture();
  const manifest = buildOptimizationManifest(report, candidate, mapping, "2026-08-12T00:00:00.000Z");
  assert.equal(manifest.schemaVersion, "1.0");
  assert.equal(manifest.candidate.targetNodeId, "toolNode_catalog");
  assert.equal(manifest.source.flowFingerprint, mapping.graph.sourceFingerprint);
});

test("marks generated artifacts as review-only", () => {
  const { report, candidate, mapping } = fixture();
  const manifest = buildOptimizationManifest(report, candidate, mapping);
  assert.equal(manifest.importReady, false);
  assert.equal(manifest.approvalRequired, true);
});

test("includes measured cache replay evidence in the proposed diff", () => {
  const { report, candidate, mapping } = fixture();
  const diff = buildProposedFlowDiff(buildOptimizationManifest(report, candidate, mapping));
  assert.match(diff, /measuredReplayLatencySavedSeconds/);
  assert.match(diff, /toolNode_catalog/);
  assert.match(diff, /not an automatically importable/);
});

test("generates a portable cache-boundary code artifact", () => {
  const { report, candidate, mapping } = fixture();
  const script = buildCacheBoundaryScript(buildOptimizationManifest(report, candidate, mapping));
  assert.match(script!, /reviewOnlyCacheBoundary/);
  assert.match(script!, /invokeOriginal/);
  assert.equal(script!.includes("sku-A"), false);
});

test("does not generate a cache script for non-cache candidates", () => {
  const report = analyzeTraceCsv(generateDemoCsv());
  const candidate = report.candidates.find((item) => item.type === "model-rightsize")!;
  const manifest = buildOptimizationManifest(report, candidate, null);
  assert.equal(buildCacheBoundaryScript(manifest), null);
});
