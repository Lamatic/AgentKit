import assert from "node:assert/strict";
import test from "node:test";
import { canApproveTasks, canScoreAssignment, clearedDownstreamState } from "../lib/workflow-state";

test("no proposal cannot be approved or scored", () => {
  assert.equal(canApproveTasks([]), false);
  assert.equal(canScoreAssignment([], true), false);
});

test("proposal regeneration clears all downstream state", () => {
  assert.deepEqual(clearedDownstreamState(), {
    tasksApproved: false,
    recommendation: null,
    assignmentApproved: false,
    approvalToken: null,
    executionContext: null
  });
});
