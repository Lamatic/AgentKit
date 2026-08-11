"use server";

import { getFlowId, lamatic } from "../lib/lamatic-client";
import { prCompanionSchema } from "../lib/schema";

/** Result returned to the client after attempting to generate a PR description. */
export type PRCompanionResult = {
  ok: boolean;
  output?: string;
  error?: string;
};

/**
 * Validates the submitted diff/commits/intent against the shared schema,
 * then calls the deployed `pr-flow` Lamatic flow to generate a PR
 * description. Never throws — all failure paths return `{ ok: false }`.
 */
export async function generatePRDescription(
  rawInput: unknown
): Promise<PRCompanionResult> {
  const parsed = prCompanionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { diffOrFiles, commitMessages, intent } = parsed.data;

  const flowId = getFlowId();
  const payload = {
    diff_or_files: diffOrFiles,
    commit_messages: commitMessages,
    intent: intent ?? "",
  };

  try {
    const response = await lamatic.executeFlow(flowId, payload);
    if (response.status === "error") {
      return { ok: false, error: response.message ?? "Flow returned an error." };
    }
    return { ok: true, output: String(response.result ?? "") };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Something went wrong calling the flow." };
  }
}