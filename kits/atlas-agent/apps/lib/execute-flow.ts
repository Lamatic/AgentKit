import { getLamaticClient } from "@/lib/lamatic-client";
import { appConfig } from "@/lib/app-config";

export type AtlasFlow = keyof typeof appConfig.flows;

export async function runAtlasFlow(flow: AtlasFlow, input: Record<string, unknown>) {
  const flowId = appConfig.flows[flow];
  if (!flowId) throw new Error(`Missing deployed flow ID for ${flow}`);
  const response = await getLamaticClient().executeFlow(flowId, input);
  return response?.result ?? response;
}
