"use server";

import { createApprovalToken, resolveApprovedContext, verifyApprovalToken, type ApprovalContext } from "@/lib/approval-token";
import { runAtlasFlow } from "@/lib/execute-flow";

export async function approveExecutionContext(input: ApprovalContext) {
  try {
    const token = createApprovalToken(resolveApprovedContext(input), process.env.ATLAS_APPROVAL_SECRET);
    return { success: true as const, token };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Approval failed" };
  }
}

export async function deliverApprovedExecutionContext(token: string | undefined) {
  try {
    const approved = verifyApprovalToken(token, process.env.ATLAS_APPROVAL_SECRET);
    const data = await runAtlasFlow("deliverExecutionContext", {
      approvedTask: approved.approvedTask,
      requirements: approved.requirements,
      documents: approved.documents
    });
    return { success: true as const, data };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Approval verification failed" };
  }
}
