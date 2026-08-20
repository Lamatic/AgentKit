import { getLamaticClient } from "@/lib/lamatic-client";
import { appConfig } from "@/lib/app-config";

export type AtlasFlow = keyof typeof appConfig.flows;

type FlowClient = {
  executeFlow(flowId: string, input: Record<string, unknown>): Promise<{ result?: unknown } | unknown>;
};

type FlowDependencies = {
  flowIds: typeof appConfig.flows;
  client: FlowClient;
};

export function resolveFlowResponse(response: { result?: unknown } | unknown) {
  return response && typeof response === "object" && "result" in response
    ? (response as { result?: unknown }).result ?? response
    : response;
}

export async function runAtlasFlow(
  flow: AtlasFlow,
  input: Record<string, unknown>,
  dependencies?: FlowDependencies
) {
  const flowIds = dependencies?.flowIds ?? appConfig.flows;
  const flowId = flowIds[flow];
  if (!flowId) throw new Error(`Missing deployed flow ID for ${flow}`);
  const client = dependencies?.client ?? getLamaticClient();
  const response = await client.executeFlow(flowId, input);
  return resolveFlowResponse(response);
}
