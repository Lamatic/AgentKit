import assert from "node:assert/strict";
import test from "node:test";
import { createApprovalToken, resolveApprovedContext, verifyApprovalToken } from "../lib/approval-token";

const secret = "test-only-secret-that-is-longer-than-32-characters";
const now = 1_800_000_000_000;
const context = {
  approvedTask: { id: "TASK-7", title: "Implement reset", requirementIds: ["REQ-1"] },
  requirements: [{ id: "REQ-1", documentId: "DOC-1", description: "Reset passwords" }],
  documents: [{ id: "DOC-1", name: "Demo PRD" }]
};

test("missing approval is rejected", () => {
  assert.throws(() => verifyApprovalToken(undefined, secret, now), /required/);
});

test("tampered approval is rejected", () => {
  const token = createApprovalToken(context, secret, now);
  assert.throws(() => verifyApprovalToken(`${token}x`, secret, now), /Invalid/);
});

test("expired approval is rejected", () => {
  const token = createApprovalToken(context, secret, now);
  assert.throws(() => verifyApprovalToken(token, secret, now + 5 * 60 * 1000), /expired/);
});

test("valid approval resolves trusted execution context", () => {
  const untrustedInput = {
    ...context,
    requirements: [...context.requirements, { id: "REQ-OTHER", documentId: "DOC-OTHER" }],
    documents: [...context.documents, { id: "DOC-OTHER", name: "Unlinked document" }]
  };
  const token = createApprovalToken(resolveApprovedContext(untrustedInput), secret, now);
  const approved = verifyApprovalToken(token, secret, now + 1);
  assert.equal(approved.taskId, "TASK-7");
  assert.deepEqual(approved.requirementIds, ["REQ-1"]);
  assert.deepEqual(approved.documentIds, ["DOC-1"]);
  assert.deepEqual(approved.approvedTask, context.approvedTask);
  assert.deepEqual(approved.requirements, context.requirements);
  assert.deepEqual(approved.documents, context.documents);
});
