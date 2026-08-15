import assert from "node:assert/strict";
import test from "node:test";

const flowModules = {
  "atlas-extract-requirements": () => import("../flows/atlas-extract-requirements"),
  "atlas-generate-task-proposals": () => import("../flows/atlas-generate-task-proposals"),
  "atlas-recommend-assignment": () => import("../flows/atlas-recommend-assignment"),
  "atlas-deliver-execution-context": () => import("../flows/atlas-deliver-execution-context")
};

for (const [name, load] of Object.entries(flowModules)) {
  test(`${name} exposes a connected Studio config_json graph`, async () => {
    const flow = await load();
    const config = flow.config_json;
    assert.ok(config && typeof config === "object", "config_json must exist");
    assert.ok(Array.isArray(config.nodes) && config.nodes.length > 0, "config_json.nodes must be non-empty");
    assert.ok(Array.isArray(config.edges), "config_json.edges must be an array");

    const nodeIds = config.nodes.map((node) => node.id);
    assert.equal(new Set(nodeIds).size, nodeIds.length, "node IDs must be unique");
    for (const edge of config.edges) {
      assert.ok(nodeIds.includes(edge.source), `edge ${edge.id} has an unknown source`);
      assert.ok(nodeIds.includes(edge.target), `edge ${edge.id} has an unknown target`);
    }

    assert.ok(config.nodes.some((node) => node.type === "triggerNode"), "trigger node is required");
    assert.ok(config.nodes.some((node) => node.type === "responseNode"), "response node is required");
    assert.equal(flow.nodes, config.nodes, "top-level nodes must alias config_json.nodes");
    assert.equal(flow.edges, config.edges, "top-level edges must alias config_json.edges");
    assert.equal(flow.default.config_json, config, "default export must include config_json");
  });
}
