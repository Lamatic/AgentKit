"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import type { MoUFormData, MoUFlowResult } from "@/lib/schema";
import kitConfig from "../../lamatic.config";

const TIMEOUT_MS = 240000; // 4 minutes — the LLM generates ~4K tokens of clause JSON

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Flatten the nested MoUFormData into the FLAT trigger field names that
 * validate-input.ts reads. The Lamatic GraphQL trigger schema is flat:
 * partyAName, partyAType, etc. — not partyA.name, partyA.type.
 *
 * CRITICAL: `deliverables` MUST be sent as a JSON STRING, not a raw array.
 * The Lamatic GraphQL trigger schema types deliverables as `String`.
 * Sending a raw array of objects causes a GraphQL type error:
 *   "expected object" / "Variable ... got invalid value"
 * validate-input.ts JSON.parses it back on the server side.
 */
function flattenFormToTrigger(form: MoUFormData): Record<string, unknown> {
  return {
    // Agreement basics
    agreementTitle: form.agreementTitle,
    effectiveDate: form.effectiveDate,
    engagementType: form.engagementType,

    // Party A — flatten nested object
    partyAName: form.partyA.name,
    partyAType: form.partyA.type,
    partyAAddress: form.partyA.address,
    partyASignatory: form.partyA.signatory,
    partyASignatoryRole: form.partyA.signatoryRole,
    partyAEmail: form.partyA.email,

    // Party B — flatten nested object
    partyBName: form.partyB.name,
    partyBType: form.partyB.type,
    partyBAddress: form.partyB.address,
    partyBSignatory: form.partyB.signatory,
    partyBSignatoryRole: form.partyB.signatoryRole,
    partyBEmail: form.partyB.email,

    // Scope & deliverables
    scopeOfWork: form.scopeOfWork,
    // NON-NEGOTIABLE: JSON.stringify. The trigger schema types this as String.
    // A raw array causes "expected object" from the GraphQL layer.
    // validate-input.ts JSON.parses it back.
    deliverables: JSON.stringify(form.deliverables),

    // Commercials
    totalFeeAmount: form.totalFeeAmount,
    totalFeeCurrency: form.totalFeeCurrency.toUpperCase(),
    paymentSchedule: form.paymentSchedule,
    paymentPreset: form.paymentPreset,
    customDepositPct: form.customDepositPct ?? 30,
    customPaymentDays: form.customPaymentDays ?? 15,

    // Event dates / time / venue
    eventStart: form.eventStart ?? "",
    eventEnd: form.eventEnd ?? "",
    eventStartTime: form.eventStartTime ?? "",
    eventEndTime: form.eventEndTime ?? "",
    eventVenue: form.eventVenue ?? "",

    // Payment timing & taxes
    paymentTiming: form.paymentTiming,
    paymentTimingCustom: form.paymentTimingCustom ?? "",
    taxesIncluded: form.taxesIncluded,
    taxRatePct: form.taxRatePct,
    lateFeePctPerMonth: form.lateFeePctPerMonth,

    // Cancellation
    cancellationPolicy: form.cancellationPolicy,
    cancellationTerms: form.cancellationTerms ?? "",

    // Catering-specific
    guestCountFinalDate: form.guestCountFinalDate ?? "",
    extraGuestRate: form.extraGuestRate ?? 0,
    foodSafetyRequired: form.foodSafetyRequired,
    allergyHandlingRequired: form.allergyHandlingRequired,

    // Risk & protection
    confidentialityRequired: form.confidentialityRequired,
    confidentialitySurvivalYears: form.confidentialitySurvivalYears,
    ipOwnership: form.ipOwnership,
    ipPortfolioRights: form.ipPortfolioRights,
    terminationPreset: form.terminationPreset,
    insuranceRequired: form.insuranceRequired,
    insuranceGenLiab: form.insuranceGenLiab,
    insuranceProfIndem: form.insuranceProfIndem,
    dataProtectionRequired: form.dataProtectionRequired,
    subcontractingAllowed: form.subcontractingAllowed,
    noPublicityRequired: form.noPublicityRequired,
    liabilityCapMultiplier: form.liabilityCapMultiplier,

    // Jurisdiction
    governingLaw: form.governingLaw,
    disputeResolution: form.disputeResolution,
    disputeVenue: form.disputeVenue,

    // Additional context
    additionalContext: form.additionalContext ?? "",
  };
}

export async function generateMoU(
  formData: MoUFormData
): Promise<{
  success: boolean;
  data?: MoUFlowResult;
  error?: string;
}> {
  try {
    const mouStep = kitConfig.steps.find((s) => s.id === "mou-drafter");
    const flowEnvKey = (mouStep as any)?.envKey ?? "MOU_DRAFTER_FLOW_ID";
    const flowId = process.env[flowEnvKey] ?? process.env.MOU_DRAFTER_FLOW_ID;
    if (!flowId) {
      throw new Error(
        `Flow ID not set. Add ${flowEnvKey} to your .env.local file.`
      );
    }

    const flatInputs = flattenFormToTrigger(formData);

    console.log("[mou-drafter] Sending flat inputs to flow:", {
      agreementTitle: "[REDACTED]", // intentionally redacted — user-supplied title is PII-adjacent
      deliverables_type: typeof flatInputs.deliverables,
      deliverables_is_string: typeof flatInputs.deliverables === "string",
      partyAName: "[redacted]",
      partyBName: "[redacted]",
    });

    const resData: any = await withTimeout(
      lamaticClient.executeFlow(flowId, flatInputs),
      TIMEOUT_MS,
      "The MoU generation is taking longer than expected. The LLM may be overloaded. Please try again in a minute."
    );

    // The flow returns { latex, clauseJson, warnings, patternReport }
    // in resData.result (the response node's output mapping)
    const result = resData?.result;

    if (!result) {
      throw new Error("No result returned from the MoU Drafter flow.");
    }

    // The flow's response node maps to the codeNode output directly.
    // Depending on Lamatic's response shape, the fields may be nested
    // under result or result.output. Try both paths.
    const latex = result.latex ?? result.output?.latex;
    const clauseJson = result.clauseJson ?? result.output?.clauseJson ?? {};
    const warnings = result.warnings ?? result.output?.warnings ?? [];
    const patternReport = result.patternReport ??
      result.output?.patternReport ?? {
      expected: [],
      found: [],
      missing: [],
      unexpected: [],
    };

    if (!latex) {
      throw new Error(
        "No LaTeX output returned. The LLM may have refused the draft. " +
        "Warnings: " +
        JSON.stringify(warnings)
      );
    }

    return {
      success: true,
      data: { latex, clauseJson, warnings, patternReport },
    };
  } catch (error) {
    console.error("[mou-drafter] Generation error:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic. Check your internet connection and API URL.";
      } else if (error.message.includes("API key")) {
        errorMessage =
          "Authentication error: Check your LAMATIC_API_KEY in .env.local.";
      }
    }

    return { success: false, error: errorMessage };
  }
}
