import assert from "node:assert/strict";
import test from "node:test";
import { analyzeTraceCsv } from "./analyze";
import { generateDemoCsv } from "./demo-data";

test("groups Lamatic trace rows by requestId and excludes failed runs from mining", () => {
  const report = analyzeTraceCsv(generateDemoCsv());

  assert.equal(report.source.requests, 32);
  assert.equal(report.metrics.successfulRuns, 29);
  assert.equal(report.metrics.failedRuns, 3);
  assert.ok(report.paths.some((path) => path.successRuns === 24));
  assert.ok(report.warnings.some((warning) => warning.includes("excluded")));
});

test("surfaces exact-cache, model-rightsize, and reusable-subflow evidence", () => {
  const report = analyzeTraceCsv(generateDemoCsv());
  const types = new Set(report.candidates.map((candidate) => candidate.type));

  assert.ok(types.has("exact-cache"));
  assert.ok(types.has("model-rightsize"));
  assert.ok(types.has("reusable-subflow"));

  const cache = report.candidates.find(
    (candidate) => candidate.type === "exact-cache" && candidate.target === "Catalog Lookup",
  );
  assert.ok(cache);
  assert.equal(cache.outputStability, 1);
  assert.ok(cache.estimatedWindowLatencySavingsSeconds > 20);
  assert.ok(cache.assumptions.some((assumption) => assumption.includes("scenario estimate")));
});

test("does not retain raw node payload values in the analysis report", () => {
  const reportText = JSON.stringify(analyzeTraceCsv(generateDemoCsv()));

  assert.equal(reportText.includes("Question 1"), false);
  assert.equal(reportText.includes("Grounded response"), false);
  assert.ok(reportText.includes("fp_"));
});

test("rejects files that are not Lamatic trace exports", () => {
  assert.throws(
    () => analyzeTraceCsv("name,value\nfoo,bar"),
    /Missing requestId column/,
  );
});

test("supports snake_case aliases from older exports", () => {
  const csv = [
    "request_id,eventMessage,workflow_name,node_name,node_id,status,time_taken_seconds,timestamp,input,output",
    'req-1,NodeExecution,Demo,Router,LLMNode,200,0.4,2026-08-01T00:00:00Z,"{""x"":1}","{""route"":""a""}"',
    "req-1,FinishedExecution,Demo,,,200,0.5,2026-08-01T00:00:01Z,,",
  ].join("\n");
  const report = analyzeTraceCsv(csv);

  assert.equal(report.source.requests, 1);
  assert.equal(report.executions[0].pathSignature, "Router");
  assert.equal(report.metrics.p50Seconds, 0.5);
});

test("uses execution_type when current Lamatic event_message contains descriptive text", () => {
  const csv = [
    "requestId,execution_type,event_message,workflowName,nodeName,nodeId,status,timeTakenSeconds,timestamp,input,output",
    'req-live,NodeExecution,"NodeExecution - Flow: Demo - Node: graphqlNode - Env: production",Demo,API Request,graphqlNode,200,0,2026-08-01T00:00:00Z,"{}","{}"',
    'req-live,NodeExecution,"NodeExecution - Flow: Demo - Node: graphqlResponseNode - Env: production",Demo,API Response,graphqlResponseNode,200,0,2026-08-01T00:00:01Z,"{}","{}"',
    'req-live,FinishedExecution,"FinishedExecution - Flow: Demo - Status: 200 - Env: production",Demo,API Request,triggerNode_1,200,18.567,2026-08-01T00:00:18Z,"{}","{}"',
  ].join("\n");
  const report = analyzeTraceCsv(csv);

  assert.equal(report.executions[0].pathSignature, "API Request → API Response");
  assert.equal(report.metrics.p50Seconds, 18.567);
});
