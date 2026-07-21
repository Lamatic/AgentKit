"use server";

import { getLamaticClient } from "@/lib/lamatic-client";

/**
 * Runs the SubSniffer flow against a pasted statement and returns the audit.
 * @param statement - Raw charges (bank statement, CSV, or "Merchant $amount" lines).
 * @param goals - Optional optimization focus, e.g. "cancel anything unused in 60 days".
 * @returns Success flag with structured `data` ({ analysis, report }) or an error message.
 */
export async function auditSubscriptions(
  statement: string,
  goals?: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const flowId = process.env.SUBSNIFFER_FLOW_ID;
    if (!flowId) {
      throw new Error(
        "SUBSNIFFER_FLOW_ID is not set. Deploy the SubSniffer flow in Lamatic and add its id to apps/.env.local.",
      );
    }

    const client = getLamaticClient();
    const res = await client.executeFlow(flowId, {
      statement,
      goals: goals ?? "",
    });

    // The flow returns { analysis, report }; tolerate a few response shapes.
    const data =
      res?.result?.answer ?? res?.result ?? res?.output ?? res;

    if (!data) {
      throw new Error("No result returned from the flow.");
    }

    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}
