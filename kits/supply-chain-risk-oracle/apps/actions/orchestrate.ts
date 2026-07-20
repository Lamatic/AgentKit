"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "@/lib/config";
import type { ActionResult, ScanResult, EmailDraft } from "@/lib/types";

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("fetch failed"))
      return "Network error reaching Lamatic. Check LAMATIC_API_URL and your connection.";
    if (error.message.toLowerCase().includes("api key"))
      return "Authentication error. Check LAMATIC_API_KEY in .env.local.";
    return error.message;
  }
  return "Something went wrong.";
}

export async function runSupplyChainScan(
  suppliers: string,
  scanFocus: string
): Promise<ActionResult<ScanResult>> {
  if (!suppliers.trim()) {
    return { success: false, error: "Please paste or upload your supplier data." };
  }

  try {
    const workflowId = config.flows["supply-chain-scan"].workflowId;
    const res = await lamaticClient.executeFlow(workflowId, {
      suppliers: suppliers.trim(),
      scan_focus: scanFocus.trim(),
      news_api_key: process.env.NEWS_API_KEY ?? "",
      weather_api_key: process.env.WEATHER_API_KEY ?? "",
    });

    const result = (res as { result?: Partial<ScanResult> })?.result;
    if (!result?.risk_matrix) {
      throw new Error("The scan flow returned no risk matrix. Check the flow deployment.");
    }

    return {
      success: true,
      data: {
        risk_matrix: result.risk_matrix ?? [],
        high_risk_suppliers: result.high_risk_suppliers ?? [],
        scan_timestamp: result.scan_timestamp ?? new Date().toISOString(),
        summary: result.summary ?? "",
      },
    };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

export async function draftSupplierEmail(
  supplierName: string,
  location: string,
  riskScore: number,
  riskFactors: string[],
  componentsSupplied: string
): Promise<ActionResult<EmailDraft>> {
  try {
    const workflowId = config.flows["supply-chain-email-draft"].workflowId;
    const res = await lamaticClient.executeFlow(workflowId, {
      supplier_name: supplierName,
      location,
      risk_score: riskScore,
      risk_factors: riskFactors.join(", "),
      components_supplied: componentsSupplied,
    });

    const raw = (res as { result?: unknown })?.result;

    let draft: Partial<EmailDraft>;
    if (typeof raw === "string") {
      try {
        const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
        draft = JSON.parse(cleaned);
      } catch {
        throw new Error("Email draft flow returned an unparseable response.");
      }
    } else {
      draft = (raw ?? {}) as Partial<EmailDraft>;
    }

    if (!draft.email_subject || !draft.email_body) {
      throw new Error("Email draft flow is missing subject or body. Check the flow deployment.");
    }

    return {
      success: true,
      data: {
        email_subject: draft.email_subject,
        email_body: draft.email_body,
        urgency_level: draft.urgency_level ?? "elevated",
      },
    };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}
