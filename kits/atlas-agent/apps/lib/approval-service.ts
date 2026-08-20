import type { ApprovalStore } from "@/lib/approval-store";
import {
  createApprovalRecord,
  createApprovalToken,
  verifyApprovalToken,
  type ApprovalContext,
  type ApprovalRecord
} from "@/lib/approval-token";

export async function persistApproval(
  context: ApprovalContext,
  store: ApprovalStore,
  secret: string | undefined,
  now = Date.now()
): Promise<string> {
  const record = createApprovalRecord(context, now);
  await store.createApproval(record);
  return createApprovalToken(record, secret);
}

export async function consumeApprovedContext(
  token: string | undefined,
  store: ApprovalStore,
  secret: string | undefined,
  now = Date.now()
): Promise<ApprovalRecord> {
  const locator = verifyApprovalToken(token, secret, now);
  const record = await store.consumeApproval(locator.nonce, now);
  if (record.taskId !== locator.taskId || record.issuedAt !== locator.issuedAt || record.expiresAt !== locator.expiresAt) {
    throw new Error("Invalid approval token");
  }
  return record;
}
