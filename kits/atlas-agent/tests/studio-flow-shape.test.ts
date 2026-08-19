import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const flowModules = {
  "atlas-extract-requirements": () => import("../flows/atlas-extract-requirements"),
  "atlas-generate-task-proposals": () => import("../flows/atlas-generate-task-proposals"),
  "atlas-recommend-assignment": () => import("../flows/atlas-recommend-assignment"),
  "atlas-deliver-execution-context": () => import("../flows/atlas-deliver-execution-context")
};

for (const [name, load] of Object.entries(flowModules)) {
  test(`${name} exposes a canonical connected Studio graph`, async () => {
    const flow = await load();
    assert.ok(Array.isArray(flow.nodes) && flow.nodes.length > 0, "nodes must be non-empty");
    assert.ok(Array.isArray(flow.edges), "edges must be an array");

    const nodeIds = flow.nodes.map((node) => node.id);
    assert.equal(new Set(nodeIds).size, nodeIds.length, "node IDs must be unique");
    for (const edge of flow.edges) {
      assert.ok(nodeIds.includes(edge.source), `edge ${edge.id} has an unknown source`);
      assert.ok(nodeIds.includes(edge.target), `edge ${edge.id} has an unknown target`);
    }

    assert.ok(flow.nodes.some((node) => node.type === "triggerNode"), "trigger node is required");
    assert.ok(flow.nodes.some((node) => node.type === "responseNode"), "response node is required");
    assert.equal(flow.default.nodes, flow.nodes, "default export must include top-level nodes");
    assert.equal(flow.default.edges, flow.edges, "default export must include top-level edges");

    const source = await readFile(new URL(`../flows/${name}.ts`, import.meta.url), "utf8");
    assert.match(source, /export const nodes = \[/, "nodes must be a literal top-level export");
    assert.match(source, /export const edges = \[/, "edges must be a literal top-level export");
    assert.doesNotMatch(source, /config_json/, "legacy config_json wrapper must not be present");
    assert.match(source, /\"id\":/, "Studio graph properties must use JSON-compatible quoted keys");
  });
}
