import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import reviewerFlow from "../../flows/sql-tuner-reviewer.ts";
import strategistFlow from "../../flows/sql-tuner-strategist.ts";
import reviewerModel from "../../model-configs/sql-tuner-reviewer_instructor-llmnode-202_generative-model-name.ts";
import strategistModel from "../../model-configs/sql-tuner-strategist_instructor-llmnode-101_generative-model-name.ts";

import {
  AGENT_CONTRACT_VERSION,
  reviewerInputSchema,
  reviewerOutputSchema,
  strategistDecisionSchema,
  strategistInputSchema,
} from "../lib/contracts.ts";

const benchmark = {
  warmupRuns: 1,
  measuredRuns: [10, 11, 10, 9, 10],
  medianMs: 10,
};

const result = {
  columns: ["customer_id", "revenue"],
  rowCount: 2,
  ordered: false,
  hash: "fixture-result-hash",
  exceededRowLimit: false,
};

const baseline = {
  query: "SELECT customer_id, SUM(total) AS revenue FROM orders GROUP BY customer_id",
  plan: [{ id: 1, parentId: 0, detail: "SCAN orders" }],
  result,
  benchmark,
};

const schema = [{
  name: "orders",
  columns: [
    { name: "customer_id", declaredType: "INTEGER", nullable: false, primaryKeyPosition: 0 },
    { name: "total", declaredType: "REAL", nullable: false, primaryKeyPosition: 0 },
  ],
  indexes: [],
}];

const experiment = {
  number: 1,
  kind: "create_index",
  strategy: "covering_index",
  hypothesis: "A covering index may avoid table reads.",
  candidateSql: "CREATE INDEX idx_orders_customer_total ON orders(customer_id, total);",
  expectedPlanChange: "SCAN orders -> SCAN orders USING COVERING INDEX",
  verdict: "slower",
  summary: "Equivalent results, but the measured candidate was slower.",
  plan: [{ id: 1, parentId: 0, detail: "SCAN orders USING COVERING INDEX" }],
  result,
  benchmark: { ...benchmark, medianMs: 12 },
  equivalence: true,
  speedup: 0.83,
  failureClass: "performance",
  observation: "The covering index preserved results but increased median runtime.",
};

const validStrategistInput = {
  contractVersion: AGENT_CONTRACT_VERSION,
  originalQuery: baseline.query,
  schema,
  baseline,
  experiments: [experiment],
  attemptedStrategies: ["covering_index"],
  remainingExperiments: 4,
};

assert.equal(strategistInputSchema.safeParse(validStrategistInput).success, true);

const invalidBudget = strategistInputSchema.safeParse({
  ...validStrategistInput,
  remainingExperiments: 5,
});
assert.equal(invalidBudget.success, false, "Inconsistent experiment budgets must be rejected.");

const undercountedBudget = strategistInputSchema.safeParse({
  ...validStrategistInput,
  remainingExperiments: 3,
});
assert.equal(undercountedBudget.success, false, "Under-counted experiment budgets must be rejected.");

const invalidHistory = strategistInputSchema.safeParse({
  ...validStrategistInput,
  attemptedStrategies: ["query_rewrite"],
});
assert.equal(invalidHistory.success, false, "Strategy history must match measured evidence.");

const pivotDecision = {
  contractVersion: AGENT_CONTRACT_VERSION,
  action: "rewrite_query",
  strategy: "query_rewrite",
  hypothesis: "A pre-aggregation rewrite may reduce temporary grouping work.",
  expectedPlanChange: "Remove temporary B-tree use.",
  sql: baseline.query,
  adaptation: {
    learnedFromEvidence: "The covering index was slower on this dataset.",
    differsFromPrevious: "This tests query shape instead of another index.",
    respondsToExperiment: 1,
  },
  stopConditions: ["Stop if the rewrite changes results or is not at least 1.10x faster."],
};
assert.equal(strategistDecisionSchema.safeParse(pivotDecision).success, true);

const contradictoryReview = reviewerInputSchema.safeParse({
  contractVersion: AGENT_CONTRACT_VERSION,
  originalQuery: baseline.query,
  baseline,
  experiments: [experiment],
  deterministicOutcome: "improved",
  winningExperimentNumber: 1,
});
assert.equal(
  contradictoryReview.success,
  false,
  "The reviewer must not promote a slower experiment to winner.",
);

const validReviewInput = {
  contractVersion: AGENT_CONTRACT_VERSION,
  originalQuery: baseline.query,
  baseline,
  experiments: [experiment],
  deterministicOutcome: "no-proven-improvement",
};
assert.equal(reviewerInputSchema.safeParse(validReviewInput).success, true);

assert.equal(reviewerOutputSchema.safeParse({
  contractVersion: AGENT_CONTRACT_VERSION,
  headline: "No measured improvement was proven",
  evidenceSummary: "Experiment 1 preserved results but was slower than the baseline.",
  recommendation: "Keep the original query and collect a representative workload before retrying.",
  limitations: ["The benchmark used the supplied SQLite snapshot."],
  citedExperiments: [1],
}).success, true);

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
for (const flow of [strategistFlow, reviewerFlow]) {
  const nodeIds = new Set(flow.nodes.map((node) => node.id));
  for (const edge of flow.edges) {
    assert.ok(nodeIds.has(edge.source), `Flow edge source ${edge.source} must exist.`);
    assert.ok(nodeIds.has(edge.target), `Flow edge target ${edge.target} must exist.`);
  }
  for (const group of [flow.references.prompts, flow.references.modelConfigs]) {
    for (const reference of Object.values(group)) {
      assert.ok(existsSync(resolve(kitRoot, reference.slice(1))), `Flow reference ${reference} must exist.`);
    }
  }
}

assert.deepEqual(
  strategistFlow.nodes.map((node) => node.data.values.nodeName),
  ["API Request", "Evidence Analyst", "Experiment Strategist", "API Response"],
);
assert.deepEqual(
  reviewerFlow.nodes.map((node) => node.data.values.nodeName),
  ["API Request", "Evidence Synthesizer", "Final Reviewer", "API Response"],
);
assert.equal(strategistModel.generativeModelName[0]?.provider_name, "gemini");
assert.equal(reviewerModel.generativeModelName[0]?.provider_name, "gemini");

console.log("Agent contract checks passed.");
