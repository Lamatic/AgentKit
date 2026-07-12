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

/**
 * DocSense intake orchestration.
 *
 * For each incoming document:
 *   1. Call the deployed Lamatic flow (extraction -> reasoning) to get
 *      the reasoning node's JSON (satisfies + triggers).
 *   2. Run the proposals through the deterministic state model:
 *      - returning clients: filter triggers to anomalies only.
 *      - apply the document -> grow the requirement list with an evidence trail.
 *   3. Return the updated outstanding list + what newly surfaced.
 *
 * The LLM proposes; the state model records, dedupes, and diffs. That split is
 * what keeps every "why is this required?" answer explainable.
 */

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
 * The flow returns { result: "<json string>" } where the string may be wrapped
 * in ```json ... ``` fences. Strip fences and parse defensively.
 */
function parseReasoning(raw: unknown): ReasoningResult {
  if (raw == null) return {};
  if (typeof raw === "object") return raw as ReasoningResult;
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

    const resData = await lamaticClient.executeFlow(
      DOCSENSE_INTAKE_FLOW_ID,
      inputs
    );

    // The flow's API Response maps the reasoning output to `result`.
    const reasoning = parseReasoning(resData?.result);
    const satisfies: string[] = reasoning.satisfies ?? [];
    let triggers: InferredTrigger[] = reasoning.triggers ?? [];

    // Returning clients: stay quiet on routine, surface only anomalies.
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