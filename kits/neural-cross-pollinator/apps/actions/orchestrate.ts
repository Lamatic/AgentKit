"use server";

import { runNeuralCrossPollinator, type CrossPollinatorResult } from "@/lib/lamatic-client";

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

  try {
    const data = await runNeuralCrossPollinator(domainA.trim(), domainB.trim());
    return { success: true, data };
  } catch (err) {
    console.error("Neural Cross-Pollinator orchestration failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong while running the flow."
    };
  }
}