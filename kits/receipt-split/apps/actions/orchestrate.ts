"use server";

import { getLamaticClient } from "@/lib/lamatic-client";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function requireFlowId(envKey: string): string {
  const id = process.env[envKey];
  if (!id) {
    throw new Error(
      `Missing ${envKey}. Set it in .env.local (see .env.example) after deploying the flow in Lamatic Studio.`
    );
  }
  return id;
}

/**
 * Step 1: send a receipt photo (+ optional OCR hint text) to the
 * `receipt-extract` flow and get back structured JSON.
 */
export async function extractReceipt(
  imageUrl: string,
  rawText: string
): Promise<ActionResult<Record<string, any>>> {
  try {
    if (!imageUrl.trim()) {
      return { success: false, error: "Please provide a receipt image URL." };
    }

    const client = getLamaticClient();
    const flowId = requireFlowId("RECEIPT_EXTRACT_FLOW_ID");

    const res = await client.executeFlow(flowId, {
      imageUrl: imageUrl.trim(),
      rawText: rawText ?? "",
    });

    if (res.status !== "success" || !res.result) {
      return {
        success: false,
        error: res.message ?? "Receipt extraction failed. Please try a different image.",
      };
    }

    return { success: true, data: res.result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error while extracting the receipt.",
    };
  }
}

/**
 * Step 2: send the structured receipt JSON from step 1, plus a plain-English
 * description of who had what, to the `bill-splitter` flow.
 */
export async function splitBill(
  receiptData: string,
  splitInstructions: string
): Promise<ActionResult<Record<string, any>>> {
  try {
    if (!receiptData.trim() || !splitInstructions.trim()) {
      return {
        success: false,
        error: "Both the receipt data and the split instructions are required.",
      };
    }

    const client = getLamaticClient();
    const flowId = requireFlowId("BILL_SPLITTER_FLOW_ID");

    const res = await client.executeFlow(flowId, {
      receiptData,
      splitInstructions: splitInstructions.trim(),
    });

    if (res.status !== "success" || !res.result) {
      return {
        success: false,
        error: res.message ?? "Splitting the bill failed. Please check your instructions and try again.",
      };
    }

    return { success: true, data: res.result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error while splitting the bill.",
    };
  }
}
