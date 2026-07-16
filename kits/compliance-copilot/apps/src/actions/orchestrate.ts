"use server";

import { client } from "../lib/lamatic-client";

export async function checkCompliance(documentText: string, guidelines: string) {
  try {
    const flowId = process.env.COMPLIANCE_AUDIT;
    if (!flowId) {
      throw new Error("COMPLIANCE_AUDIT flow ID is not set in environment variables");
    }

    const response = await client.executeFlow(flowId, {
      documentText,
      guidelines,
    });

    return { success: true, data: response };
  } catch (error: any) {
    console.error("Compliance Check Error:", error);
    return { success: false, error: error.message || "An unknown error occurred" };
  }
}
