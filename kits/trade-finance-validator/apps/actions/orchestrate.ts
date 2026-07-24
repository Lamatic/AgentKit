"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate";

export type ValidationResult = {
  check: string;
  status: "pass" | "fail" | "warning";
  note: string | null;
};

export type ValidationReport = {
  document_type: string;
  extracted_fields: Record<string, string | boolean | null>;
  validation_results: ValidationResult[];
  confidence_score: number;
  summary: string;
  overall_status: "passed" | "passed_with_warnings" | "failed";
};

export async function validateDocument(
  documentText: string,
  fileName: string
): Promise<{ success: boolean; data?: ValidationReport; error?: string }> {
  try {
    const flow = config.flows.tradeFinanceValidator;

    if (!flow.workflowId) {
      throw new Error("Flow ID not configured. Check your .env.local file.");
    }

    const todayDate = new Date().toISOString().split("T")[0];

    const inputs = {
      document_text: documentText,
      file_name: fileName,
      today_date: todayDate,
    };

    let resData: any = await lamaticClient.executeFlow(flow.workflowId, inputs);

    // The flow may resolve asynchronously: executeFlow / checkStatus can each
    // hand back another requestId to poll instead of the final payload.
    let payload: any = resData?.data?.output?.result ?? resData?.result?.result ?? resData?.result;
    let attempts = 0;

    while (payload?.requestId && attempts < 10) {
      resData = await lamaticClient.checkStatus(payload.requestId);

      if (resData.status && resData.status !== "success") {
        throw new Error(resData.message || "Validation flow did not complete successfully.");
      }

      payload = resData?.data?.output?.result ?? resData?.result?.result ?? resData?.result;
      attempts += 1;
    }

    const result = payload;

    if (!result) {
      throw new Error("No result returned from the validation flow.");
    }

    return { success: true, data: result as ValidationReport };
  } catch (error) {
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to reach the Lamatic service. Check your internet connection and API URL.";
      } else if (error.message.includes("API key")) {
        errorMessage =
          "Authentication error: Check your LAMATIC_API_KEY in .env.local.";
      }
    }
    return { success: false, error: errorMessage };
  }
}
