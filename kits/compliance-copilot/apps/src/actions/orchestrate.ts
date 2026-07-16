"use server";

import { client } from "../lib/lamatic-client";

/**
 * Executes the compliance-audit flow on Lamatic.
 * Sends the document text and compliance guidelines to the deployed flow
 * and returns a structured audit result with requirement, status, analysis, and remediation.
 * @param documentText - The raw document content to audit (e.g., a privacy policy).
 * @param guidelines - The compliance rules or checklist to evaluate against.
 * @returns An object with `success: true` and `data` on success, or `success: false` and `error` on failure.
 */
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
