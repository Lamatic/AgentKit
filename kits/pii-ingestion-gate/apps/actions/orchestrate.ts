"use server";

import { getLamaticClient } from "@/lib/lamatic-client";

type ActionResult = { success: boolean; data?: any; error?: string };

/** Parses a value if it's a JSON string, otherwise returns it unchanged. */
function maybeParse(value: any) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Executes a deployed Lamatic flow and normalizes the response shape.
 */
async function runFlow(
  flowId: string | undefined,
  envKey: string,
  inputs: Record<string, string>,
): Promise<ActionResult> {
  try {
    if (!flowId) {
      throw new Error(
        `${envKey} is not set. Deploy the flow in Lamatic Studio and add its id to apps/.env.local.`,
      );
    }

    const client = getLamaticClient();
    const res = await client.executeFlow(flowId, inputs);

    // Surface Lamatic-side errors (auth, deployment, quota) to the UI.
    if (res?.status === "error" || res?.statusCode >= 400) {
      throw new Error(
        `Lamatic returned ${res?.statusCode ?? "an error"}: ${res?.message ?? "Unknown error"}. ` +
          "Check that the flow is deployed and your API key/project ID are correct.",
      );
    }

    // Tolerate the response shapes the SDK may return.
    let data = maybeParse(
      res?.result?.answer ?? res?.result ?? res?.output ?? res,
    );
    if (!data) {
      throw new Error("No result returned from the flow.");
    }

    // Nested fields may themselves arrive as JSON strings — normalize them.
    if (typeof data === "object") {
      for (const key of ["analysis", "result", "report"]) {
        if (key in data) data[key] = maybeParse(data[key]);
      }
    }

    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}

/**
 * Runs the scan-document flow: detects PII/credentials/confidential data and
 * returns { analysis, report } with a safe / needs_redaction / blocked verdict.
 * @param document - Raw text of the document to scan.
 * @param policy - Optional ingestion policy (e.g. "internal names are acceptable").
 */
export async function scanDocument(
  document: string,
  policy?: string,
): Promise<ActionResult> {
  return runFlow(process.env.SCAN_DOCUMENT_FLOW_ID, "SCAN_DOCUMENT_FLOW_ID", {
    document,
    policy: policy ?? "",
  });
}

/**
 * Runs the redact-document flow: replaces sensitive spans with typed
 * placeholders and returns { result } with the redacted text + audit trail.
 * @param document - Raw text of the document to redact.
 * @param policy - Optional redaction policy (e.g. "keep internal names").
 */
export async function redactDocument(
  document: string,
  policy?: string,
): Promise<ActionResult> {
  return runFlow(
    process.env.REDACT_DOCUMENT_FLOW_ID,
    "REDACT_DOCUMENT_FLOW_ID",
    { document, policy: policy ?? "" },
  );
}
