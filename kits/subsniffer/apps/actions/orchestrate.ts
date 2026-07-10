"use server";

import { getLamaticClient } from "@/lib/lamatic-client";

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
