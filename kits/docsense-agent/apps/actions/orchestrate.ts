"use server";

import {
  lamaticClient,
  DOCSENSE_INTAKE_FLOW_ID,
} from "@/lib/lamatic-client";
import {
  type ClientProfile,
  type ReceivedDoc,
  type InferredTrigger,
  createNewClientProfile,
  applyDocument,
  detectAnomalies,
  outstanding,
} from "@/lib/requirement-state";

interface ReasoningResult {
  satisfies?: string[];
  triggers?: InferredTrigger[];
}

interface IntakeResult {
  success: boolean;
  profile?: ClientProfile;
  newlySurfaced?: { label: string; reason: string }[];
  outstanding?: { label: string; status: string }[];
  error?: string;
}

/**
 * The reasoning JSON can arrive wrapped a few ways depending on sync vs async:
 *   - { result: "<fenced string>" }          (sync response node)
 *   - { output: { ... } }                     (async checkStatus payload)
 *   - "<fenced string>"                        (raw)
 * Unwrap whichever layer we get, strip ```json fences, then parse.
 */
function parseReasoning(raw: unknown): ReasoningResult {
  if (raw == null) return {};

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.result === "string") return parseReasoning(obj.result);
    if (obj.output != null) return parseReasoning(obj.output);
    return obj as ReasoningResult;
  }

  if (typeof raw !== "string") return {};

  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as ReasoningResult;
  } catch {
    return {};
  }
}

export async function intakeDocument(
  profile: ClientProfile | null,
  clientId: string,
  documentText: string
): Promise<IntakeResult> {
  try {
    const current = profile ?? createNewClientProfile(clientId);

    const inputs = { document: documentText };

    let resData = await lamaticClient.executeFlow(
      DOCSENSE_INTAKE_FLOW_ID,
      inputs
    );

    // Async flows return only a requestId — fetch the real output via checkStatus.
    const requestId = (resData?.result as { requestId?: string })?.requestId;
    if (requestId) {
      resData = await lamaticClient.checkStatus(requestId);
    }

    // DEBUG: dump the resolved response so we can confirm the shape.
    console.log("=== RESOLVED ===", JSON.stringify(resData, null, 2));

    if (resData?.status && resData.status !== "success") {
      return {
        success: false,
        error: resData.message ?? "Flow execution failed",
      };
    }

    const reasoning = parseReasoning(
      resData?.data?.output?.result ?? resData?.result
    );
    const satisfies: string[] = reasoning.satisfies ?? [];
    let triggers: InferredTrigger[] = reasoning.triggers ?? [];

    if (current.clientType === "returning" && current.baseline) {
      triggers = detectAnomalies(current.baseline, triggers);
    }

    const doc: ReceivedDoc = {
      docId: `doc-${Date.now()}`,
      docType: "unknown",
      extractedFacts: {},
      receivedAt: new Date().toISOString(),
    };

    const { profile: updated, newlySurfaced } = applyDocument(
      current,
      doc,
      satisfies,
      triggers
    );

    return {
      success: true,
      profile: updated,
      newlySurfaced: newlySurfaced.map((r) => ({
        label: r.label,
        reason: r.source.kind === "triggered" ? r.source.reason : "",
      })),
      outstanding: outstanding(updated).map((r) => ({
        label: r.label,
        status: r.status,
      })),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}