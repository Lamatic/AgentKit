"use server";

import { runAtlasFlow } from "@/lib/execute-flow";

export type BrowserAtlasFlow = "extractRequirements" | "generateTaskProposals" | "recommendAssignment";

export async function executeAtlasFlow(flow: BrowserAtlasFlow, input: Record<string, unknown>) {
  try {
    const data = await runAtlasFlow(flow, input);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Atlas flow execution failed";
    return { success: false, error: message };
  }
}
