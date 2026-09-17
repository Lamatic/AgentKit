"use server";

import { runNeuralCrossPollinator, type CrossPollinatorResult } from "@/lib/lamatic-client";
import kitConfig from "../../lamatic.config";

export interface OrchestrateResponse {
  success: boolean;
  data?: CrossPollinatorResult;
  error?: string;
}

export async function orchestrate(
  domainA: string,
  domainB: string
): Promise<OrchestrateResponse> {
  if (!domainA?.trim() || !domainB?.trim()) {
    return { success: false, error: "Both domains are required." };
  }

  // Read the flow's env var name from the parent kit's config instead of
  // hardcoding it here, so this app can't silently drift out of sync with
  // what lamatic.config.ts actually declares.
  const step = kitConfig.steps[0];
  const workflowId = step ? process.env[step.envKey] : undefined;

  if (!workflowId) {
    return {
      success: false,
      error: `Missing environment variable: ${step?.envKey ?? "NEURAL_CROSS_POLLINATOR_FLOW_ID"}`
    };
  }

  try {
    const data = await runNeuralCrossPollinator(workflowId, domainA.trim(), domainB.trim());
    return { success: true, data };
  } catch (err) {
    console.error("Neural Cross-Pollinator orchestration failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong while running the flow."
    };
  }
}