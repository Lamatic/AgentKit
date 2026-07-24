"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "@/lib/config";
import type { ActionResult, ScanResult, SupplierRisk, EmailDraft } from "@/lib/types";

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

function normalizeSupplier(s: unknown, index: number): SupplierRisk {
  const r = (s ?? {}) as Record<string, unknown>;
  return {
    id:                   typeof r.id === "string"     ? r.id     : `supplier_${index + 1}`,
    name:                 typeof r.name === "string"   ? r.name   : "Unknown Supplier",
    location:             typeof r.location === "string" ? r.location : "",
    lat:                  typeof r.lat === "number"    ? r.lat    : 0,
    lng:                  typeof r.lng === "number"    ? r.lng    : 0,
    components_supplied:  typeof r.components_supplied === "string" ? r.components_supplied : "",
    tier:                 typeof r.tier === "number"   ? r.tier   : 1,
    risk_score:           typeof r.risk_score === "number" ? Math.min(100, Math.max(0, r.risk_score)) : 0,
    risk_level:           ["Critical","High","Elevated","Normal"].includes(r.risk_level as string)
                            ? (r.risk_level as SupplierRisk["risk_level"])
                            : "Normal",
    risk_factors:         Array.isArray(r.risk_factors) ? r.risk_factors.map(String) : [],
    recommended_action:   typeof r.recommended_action === "string" ? r.recommended_action : "",
    data_confidence:      ["high","medium","low"].includes(r.data_confidence as string)
                            ? (r.data_confidence as SupplierRisk["data_confidence"])
                            : "low",
  };
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
    });

    const result = (res as { result?: Partial<ScanResult> })?.result;
    if (!result?.risk_matrix) {
      throw new Error("The scan flow returned no risk matrix. Check the flow deployment.");
    }

    const riskMatrix = Array.isArray(result.risk_matrix)
      ? result.risk_matrix.map(normalizeSupplier)
      : [];

    return {
      success: true,
      data: {
        risk_matrix: riskMatrix,
        high_risk_suppliers: riskMatrix.filter((s) => s.risk_score >= 60),
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
        const cleaned = raw
          .trim()
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/, "")
          .trim();
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
