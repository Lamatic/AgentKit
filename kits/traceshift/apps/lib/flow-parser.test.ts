import assert from "node:assert/strict";
import test from "node:test";
import { analyzeTraceCsv } from "./analyze";
import { demoFlowExport } from "./demo-flow";
import { generateDemoCsv } from "./demo-data";
import { mapFlowToReport, parseLamaticFlow } from "./flow-parser";

test("parses a Studio TypeScript flow export without executing it", () => {
  const graph = parseLamaticFlow(demoFlowExport);
  assert.equal(graph.name, "Commerce Support Agent");
  assert.equal(graph.nodes.length, 6);
  assert.equal(graph.edges.length, 7);
  assert.match(graph.sourceFingerprint, /^flow_/);
});

test("preserves Lamatic node IDs and names", () => {
  const graph = parseLamaticFlow(demoFlowExport);
  assert.equal(graph.nodes.find((node) => node.name === "Catalog Lookup")?.id, "toolNode_catalog");
  assert.equal(graph.nodes.find((node) => node.id === "LLMNode_router")?.nodeId, "LLMNode");
});

test("maps trace aggregates to exported graph nodes", () => {
  const mapping = mapFlowToReport(parseLamaticFlow(demoFlowExport), analyzeTraceCsv(generateDemoCsv()));
  assert.equal(mapping.mappedNodes, 4);
  assert.ok(mapping.nodes.find((node) => node.name === "Draft Answer")!.totalSeconds > 80);
  assert.deepEqual(mapping.unmappedFlowNodes.sort(), ["API Request", "API Response"]);
});

test("maps observed traffic onto exported edges", () => {
  const mapping = mapFlowToReport(parseLamaticFlow(demoFlowExport), analyzeTraceCsv(generateDemoCsv()));
  const catalogEdge = mapping.edges.find((edge) => edge.id === "router-catalog");
  assert.equal(catalogEdge?.observedRuns, 24);
  assert.ok((catalogEdge?.shareOfSuccessfulRuns ?? 0) > 0.8);
});

test("rejects incomplete flow exports", () => {
  assert.throws(() => parseLamaticFlow("export const nodes = [];"), /missing export const edges/);
});

test("rejects graph edges that point to absent nodes", () => {
  const broken = demoFlowExport.replace('"target": "responseNode_1"', '"target": "missing"');
  assert.throws(() => parseLamaticFlow(broken), /points to a node that is not present/);
});

test("rejects oversized Studio exports before parsing", () => {
  assert.throws(() => parseLamaticFlow("x".repeat(2_000_001)), /over 2 MB/);
});

test("does not execute TypeScript embedded in an export", () => {
  const malicious = `${demoFlowExport}\n(globalThis as unknown as { compromised: boolean }).compromised = true;`;
  const graph = parseLamaticFlow(malicious);

  assert.equal(graph.nodes.length, 6);
  assert.equal((globalThis as unknown as { compromised?: boolean }).compromised, undefined);
});
