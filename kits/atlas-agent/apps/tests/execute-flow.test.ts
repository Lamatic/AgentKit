import assert from "node:assert/strict";
import test from "node:test";
import { runAtlasFlow } from "../lib/execute-flow";

const flowIds = {
  extractRequirements: "flow-extract",
  generateTaskProposals: "flow-proposals",
  recommendAssignment: "flow-assignment",
  deliverExecutionContext: "flow-context"
};

test("flow ID validation still rejects missing configuration", async () => {
  await assert.rejects(
    () => runAtlasFlow("extractRequirements", {}, {
      flowIds: { ...flowIds, extractRequirements: undefined },
      client: { executeFlow: async () => ({}) }
    }),
    /Missing deployed flow ID/
  );
});

test("flow result unwrap and response fallback remain unchanged", async () => {
  const unwrapped = await runAtlasFlow("extractRequirements", {}, {
    flowIds,
    client: { executeFlow: async () => ({ result: { requirements: ["REQ-1"] } }) }
  });
  assert.deepEqual(unwrapped, { requirements: ["REQ-1"] });

  const fallback = { status: "ok" };
  const unchanged = await runAtlasFlow("extractRequirements", {}, {
    flowIds,
    client: { executeFlow: async () => fallback }
  });
  assert.equal(unchanged, fallback);
});
