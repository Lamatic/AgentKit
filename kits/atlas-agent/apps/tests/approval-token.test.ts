import assert from "node:assert/strict";
import test from "node:test";
import { consumeApprovedContext, persistApproval } from "../lib/approval-service";
import { ApprovalAlreadyUsedError, ApprovalNotFoundError, type ApprovalStore } from "../lib/approval-store";
import { createApprovalRecord, createApprovalToken, resolveApprovedContext, type ApprovalRecord } from "../lib/approval-token";

const secret = "test-only-secret-that-is-longer-than-32-characters";
const now = 1_800_000_000_000;
const context = {
  approvedTask: { id: "TASK-7", title: "Implement reset", requirementIds: ["REQ-1"] },
  requirements: [{ id: "REQ-1", documentId: "DOC-1", description: "Reset passwords" }],
  documents: [{ id: "DOC-1", name: "Demo PRD" }]
};

class TestApprovalStore implements ApprovalStore {
  private record: ApprovalRecord | null = null;
  private consumed = false;

  async createApproval(record: ApprovalRecord) {
    this.record = structuredClone(record);
    this.consumed = false;
  }

  async getApproval(nonce: string) {
    return this.record?.nonce === nonce && !this.consumed ? structuredClone(this.record) : null;
  }

  async consumeApproval(nonce: string, consumedAt = Date.now()) {
    if (this.consumed) throw new ApprovalAlreadyUsedError();
    if (!this.record || this.record.nonce !== nonce) throw new ApprovalNotFoundError();
    this.consumed = true;
    return { ...structuredClone(this.record), consumedAt };
  }
}

test("valid token works once and second use fails", async () => {
  const store = new TestApprovalStore();
  const token = await persistApproval(context, store, secret, now);
  const approved = await consumeApprovedContext(token, store, secret, now + 1);
  assert.equal(approved.taskId, "TASK-7");
  await assert.rejects(() => consumeApprovedContext(token, store, secret, now + 2), /already been used/);
});

test("tampered token fails before durable consumption", async () => {
  const store = new TestApprovalStore();
  const token = await persistApproval(context, store, secret, now);
  await assert.rejects(() => consumeApprovedContext(`${token}x`, store, secret, now), /Invalid/);
});

test("expired token fails", async () => {
  const store = new TestApprovalStore();
  const token = await persistApproval(context, store, secret, now);
  await assert.rejects(() => consumeApprovedContext(token, store, secret, now + 5 * 60 * 1000), /expired/);
});

test("missing durable approval fails", async () => {
  const record = createApprovalRecord(context, now);
  const token = createApprovalToken(record, secret);
  await assert.rejects(() => consumeApprovedContext(token, new TestApprovalStore(), secret, now), /not found/);
});

test("context comes only from the server-approved record", async () => {
  const store = new TestApprovalStore();
  const approvedContext = resolveApprovedContext({
    ...context,
    requirements: [...context.requirements, { id: "REQ-OTHER", documentId: "DOC-OTHER" }],
    documents: [...context.documents, { id: "DOC-OTHER", name: "Unlinked document" }]
  });
  const token = await persistApproval(approvedContext, store, secret, now);
  const approved = await consumeApprovedContext(token, store, secret, now + 1);
  assert.deepEqual(approved.requirements, context.requirements);
  assert.deepEqual(approved.documents, context.documents);
});

test("two concurrent consumes cannot both succeed", async () => {
  const store = new TestApprovalStore();
  const token = await persistApproval(context, store, secret, now);
  const results = await Promise.allSettled([
    consumeApprovedContext(token, store, secret, now + 1),
    consumeApprovedContext(token, store, secret, now + 1)
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
});
