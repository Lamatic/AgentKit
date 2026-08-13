import assert from "node:assert/strict";
import test from "node:test";
import { isAdvisorProposal } from "./advisor-contract";

const proposal = {
  title: "Cache exact catalog repeats",
  recommendation: "Run the exact-input cache in shadow mode.",
  rationale: "The replay found stable repeated outputs.",
  evidence: ["20 historical hits with no mismatches."],
  risks: ["An incomplete key could return stale data."],
  validationPlan: ["Compare shadow and live outputs."],
  rollbackCondition: "Disable the cache on the first mismatch.",
  confidence: "high",
  approvalRequired: true,
};

test("accepts the complete Advisor proposal contract", () => {
  assert.equal(isAdvisorProposal(proposal), true);
});

test("rejects unsafe or incomplete Advisor proposals", () => {
  assert.equal(isAdvisorProposal({ ...proposal, approvalRequired: false }), false);
  assert.equal(isAdvisorProposal({ ...proposal, rollbackCondition: "" }), false);
  assert.equal(isAdvisorProposal({ ...proposal, risks: [42] }), false);
  assert.equal(isAdvisorProposal({ ...proposal, validationPlan: [] }), false);
  assert.equal(isAdvisorProposal({ ...proposal, confidence: "certain" }), false);
});
