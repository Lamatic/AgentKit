"use server";

import { lamatic, FLOW_ID } from "@/lib/lamatic-client";

export type Purchase = {
  retailer?: string;
  purchase_date?: string;
  invoice_number?: string;
  currency?: string;
  purchase_channel?: string;
};

export type TrackedItem = {
  name: string;
  price: number | null;
  return_deadline: string | null;
  return_days_remaining: number | null;
  return_status: string;
  return_source_text: string | null;
  warranty_deadline: string | null;
  warranty_days_remaining: number | null;
  warranty_status: string;
  warranty_source_text: string | null;
  recommended_action: string;
  recommendation_reason: string;
};

export type TrackerResult = {
  purchase: Purchase | null;
  items: TrackedItem[];
  needs_confirmation: boolean;
  missing_required_fields: string[];
  digest: string;
  parse_error: boolean;
  error_code: string;
};

export type AnalyzeResult =
  | { success: true; data: TrackerResult }
  | { success: false; error: string };

export async function analyzePurchase(
  receiptText: string,
  todayDate: string
): Promise<AnalyzeResult> {
  if (!receiptText.trim()) {
    return {
      success: false,
      error: "Please paste a receipt or order confirmation."
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(todayDate)) {
    return {
      success: false,
      error: "Please provide today's date in YYYY-MM-DD format."
    };
  }

  try {
  const response = await lamatic.executeFlow(FLOW_ID, {
    receipt_text: receiptText,
    today_date: todayDate
  });

  if (response.status !== "success") {
    return {
      success: false,
      error:
        typeof response.message === "string" && response.message
          ? response.message
          : "The workflow could not process this request."
    };
  }

  if (!response.result) {
    return {
      success: false,
      error: "The workflow returned no result."
    };
  }

  const raw = response.result as Partial<TrackerResult>;
    if (raw.parse_error) {
      return {
        success: false,
        error:
          raw.error_code === "INVALID_TODAY_DATE"
            ? "The supplied date is invalid."
            : `The workflow could not process this request${
                raw.error_code ? ` (${raw.error_code})` : ""
              }.`
      };
    }

    return {
      success: true,
      data: {
        purchase: raw.purchase ?? null,
        items: Array.isArray(raw.items) ? raw.items : [],
        needs_confirmation: Boolean(raw.needs_confirmation),
        missing_required_fields: Array.isArray(raw.missing_required_fields)
          ? raw.missing_required_fields
          : [],
        digest: typeof raw.digest === "string" ? raw.digest : "",
        parse_error: false,
        error_code: typeof raw.error_code === "string" ? raw.error_code : ""
      }
    };
  } catch {
  console.error("analyzePurchase failed while executing the Lamatic workflow.");

  return {
      success: false,
      error: "The tracker could not reach the Lamatic workflow. Please try again."
    };
  }
}
