"use server";

import { getLamaticClient } from "@/lib/lamatic-client";
import { config } from "@/orchestrate";

export type AtlasFlow = keyof typeof config.flows;

export async function executeAtlasFlow(flow: AtlasFlow, input: Record<string, unknown>) {
  try {
    const flowId = config.flows[flow];
    if (!flowId) throw new Error(`Missing deployed flow ID for ${flow}`);
    const response = await getLamaticClient().executeFlow(flowId, input);
    return { success: true, data: response?.result ?? response };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Atlas flow execution failed";
    return { success: false, error: message };
  }
}
