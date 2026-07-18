"use server";

import { headers } from "next/headers";
import kitConfig from "../../lamatic.config";
import { getLamaticClient } from "@/lib/lamatic-client";

type ActionResult = { success: boolean; data?: any; error?: string };
type StepId = "scan-document" | "redact-document";

// ── Request limits (sugg: basic abuse protection) ──────────────
// This starter kit has no user accounts; deployers should put the app
// behind their own auth (e.g. Vercel Deployment Protection, middleware,
// or an identity provider). These limits bound abuse in the meantime.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 10;
const MAX_DOCUMENT_CHARS = 100_000;
const MAX_POLICY_CHARS = 2_000;

// Sliding-window request log per client, kept in module memory.
const requestLog = new Map<string, number[]>();

/** Identifies the caller from forwarded headers (best-effort). */
async function clientKey(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

/** Returns true if the caller is within the rate limit window. */
function withinRateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_MAX_REQUESTS) {
    requestLog.set(key, recent);
    return false;
  }
  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

/**
 * Resolves a flow ID from the kit's lamatic.config.ts step definitions:
 * the step declares which env var (envKey) holds the deployed flow ID.
 */
function resolveFlowId(stepId: StepId): { flowId?: string; envKey: string } {
  const step = kitConfig.steps.find((s) => s.id === stepId);
  const envKey = step?.envKey ?? "";
  return { flowId: envKey ? process.env[envKey] : undefined, envKey };
}

/** Parses a value if it's a JSON string, otherwise returns it unchanged. */
function maybeParse(value: any) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/** Validates inputs, enforces limits, executes the flow, normalizes output. */
async function runFlow(
  stepId: StepId,
  document: string,
  policy: string,
): Promise<ActionResult> {
  try {
    if (!document?.trim()) {
      throw new Error("Document text is required.");
    }
    if (document.length > MAX_DOCUMENT_CHARS) {
      throw new Error(
        `Document is too large (max ${MAX_DOCUMENT_CHARS.toLocaleString()} characters). Chunk it upstream first.`,
      );
    }
    if (policy.length > MAX_POLICY_CHARS) {
      throw new Error(
        `Policy is too long (max ${MAX_POLICY_CHARS.toLocaleString()} characters).`,
      );
    }
    if (!withinRateLimit(await clientKey())) {
      throw new Error(
        `Rate limit exceeded (${RATE_MAX_REQUESTS} requests/minute). Try again shortly.`,
      );
    }

    const { flowId, envKey } = resolveFlowId(stepId);
    if (!flowId) {
      throw new Error(
        `${envKey || stepId} is not set. Deploy the flow in Lamatic Studio and add its id to apps/.env.local.`,
      );
    }

    const client = getLamaticClient();
    const res = await client.executeFlow(flowId, { document, policy });

    // Surface Lamatic-side errors (auth, deployment, quota) to the UI.
    if (res?.status === "error" || res?.statusCode >= 400) {
      throw new Error(
        `Lamatic returned ${res?.statusCode ?? "an error"}: ${res?.message ?? "Unknown error"}. ` +
          "Check that the flow is deployed and your API key/project ID are correct.",
      );
    }

    // Tolerate the response shapes the SDK may return.
    const data = maybeParse(
      res?.result?.answer ?? res?.result ?? res?.output ?? res,
    );
    if (!data) {
      throw new Error("No result returned from the flow.");
    }

    // Nested fields may themselves arrive as JSON strings — normalize them.
    // `report` is intentionally left as-is: it is prose for direct rendering.
    if (typeof data === "object") {
      for (const key of ["analysis", "result"]) {
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
 */
export async function scanDocument(
  document: string,
  policy?: string,
): Promise<ActionResult> {
  return runFlow("scan-document", document, policy ?? "");
}

/**
 * Runs the redact-document flow: replaces sensitive spans with typed
 * placeholders and returns { result } with the redacted text + audit trail.
 */
export async function redactDocument(
  document: string,
  policy?: string,
): Promise<ActionResult> {
  return runFlow("redact-document", document, policy ?? "");
}
