"use server";

import { lamatic, getFlowId } from "../lib/lamatic-client";

export type PRCompanionInput = {
  diffOrFiles: string;
  commitMessages: string;
  intent?: string;
};

export type PRCompanionResult = {
  ok: boolean;
  output?: string;
  error?: string;
};

export async function generatePRDescription(
  input: PRCompanionInput
): Promise<PRCompanionResult> {
  if (!input.diffOrFiles.trim() || !input.commitMessages.trim()) {
    return {
      ok: false,
      error: "Please provide both the diff/changed files and the commit messages.",
    };
  }

  try {
    const flowId = getFlowId();

    const payload = {
      diff_or_files: input.diffOrFiles,
      commit_messages: input.commitMessages,
      intent: input.intent ?? "",
    };

    // executeFlow(flowId, payload) — flowId and payload are two separate
    // arguments, not one object. This was the earlier bug.
    const response = await lamatic.executeFlow(flowId, payload);

    const anyResponse = response as any;
    const output =
      anyResponse?.result?.output ??
      anyResponse?.output ??
      anyResponse?.data?.output ??
      anyResponse?.result ??
      JSON.stringify(response);

    return { ok: true, output };
  } catch (err: any) {
    console.error("[PR Companion] flow error:", err);
    return {
      ok: false,
      error: err?.message ?? "Something went wrong calling the flow.",
    };
  }
}
