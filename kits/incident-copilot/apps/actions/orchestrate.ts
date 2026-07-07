"use server";

import { getLamaticClient } from "@/lib/lamatic-client";
import { parseInvestigation } from "@/lib/format";
import type { ActionResult, CommsResult, InvestigationResult } from "@/lib/types";

// Maps each flow to the env var holding its deployed Flow ID. These names match the
// `envKey`s declared in the kit's lamatic.config.ts steps and documented in .env.example.
const FLOW_ENV: Record<"investigate" | "draft-comms", string> = {
  investigate: "INVESTIGATE_FLOW_ID",
  "draft-comms": "DRAFT_COMMS_FLOW_ID"
};

/** Resolve a deployed flow ID from its env var. */
function resolveFlowId(flow: keyof typeof FLOW_ENV): string {
  const envKey = FLOW_ENV[flow];
  const value = process.env[envKey];
  if (!value) {
    throw new Error(`Missing environment variable "${envKey}" for flow "${flow}". Add it to .env.local.`);
  }
  return value;
}

/** Execute a flow and return its result envelope's payload. */
async function executeFlow(flowId: string, inputs: Record<string, unknown>): Promise<unknown> {
  const resData = await getLamaticClient().executeFlow(flowId, inputs);
  const envelope = resData as { result?: unknown; errors?: unknown };
  const errors = envelope?.errors;
  const hasError = typeof errors === "string" ? errors.length > 0 : Array.isArray(errors) ? errors.length > 0 : Boolean(errors);
  if (hasError) {
    throw new Error(typeof errors === "string" ? errors : "Flow returned an error");
  }
  return envelope?.result ?? resData;
}

/**
 * Run an investigation. The GitHub token is read from the server environment, never
 * from the client, so it is never exposed to the browser.
 */
export async function investigate(
  alertText: string,
  incidentId: string,
  repoUrl: string
): Promise<ActionResult<InvestigationResult>> {
  try {
    if (!alertText.trim()) throw new Error("Paste an alert to investigate.");
    if (!incidentId.trim()) throw new Error("An incident ID is required (it scopes memory).");

    const flowId = resolveFlowId("investigate");
    const raw = await executeFlow(flowId, {
      alertText: alertText.trim(),
      incidentId: incidentId.trim(),
      repoUrl: repoUrl.trim(),
      githubToken: process.env.GITHUB_TOKEN ?? ""
    });

    const result = parseInvestigation(raw);
    if (result.hypotheses.length === 0 && !result.insufficientInfo) {
      throw new Error("The investigation returned no hypotheses. Check the flow deployment and try again.");
    }
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

/** Draft the Slack update and postmortem from the leading hypothesis + evidence. */
export async function draftComms(
  hypothesis: string,
  evidence: string,
  rankedHypotheses: string,
  incidentId: string
): Promise<ActionResult<CommsResult>> {
  try {
    const flowId = resolveFlowId("draft-comms");
    const raw = (await executeFlow(flowId, {
      hypothesis,
      evidence,
      rankedHypotheses,
      incidentId
    })) as Partial<CommsResult>;

    const slackUpdate = String(raw?.slackUpdate ?? "").trim();
    const postmortem = String(raw?.postmortem ?? "").trim();
    if (!slackUpdate && !postmortem) {
      throw new Error("The comms flow returned nothing. Check the flow deployment.");
    }
    return { success: true, data: { slackUpdate, postmortem } };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("fetch failed")) {
      return "Network error reaching Lamatic. Check LAMATIC_API_URL and your connection.";
    }
    if (error.message.toLowerCase().includes("api key")) {
      return "Authentication error. Check LAMATIC_API_KEY in .env.local.";
    }
    return error.message;
  }
  return "Something went wrong.";
}
