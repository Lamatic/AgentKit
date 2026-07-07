"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "@/lib/config";

export interface OutreachInput {
  name: string;
  company: string;
  website: string;
  tone: string;
}

export interface OutreachDraft {
  subject: string;
  email: string;
  followUp: string;
}

export interface GenerateResult {
  success: boolean;
  data?: OutreachDraft;
  error?: string;
}

/**
 * Calls the deployed Lead Outreach Agent flow and returns a ready-to-send draft.
 * The flow returns a single `answer` field shaped as { subject, email, followUp }.
 */
export async function generateOutreach(
  input: OutreachInput
): Promise<GenerateResult> {
  try {
    const workflowId = config.flows["lead-outreach-agent"].workflowId;
    if (!workflowId) {
      throw new Error("Flow ID not configured.");
    }

    const res = await lamaticClient.executeFlow(workflowId, {
      name: input.name,
      company: input.company,
      website: input.website,
      tone: input.tone,
    });

    const answer = (res as { result?: { answer?: unknown } })?.result?.answer;
    if (!answer) {
      throw new Error("No answer returned from the flow.");
    }

    const draft: OutreachDraft =
      typeof answer === "string" ? JSON.parse(answer) : (answer as OutreachDraft);

    if (!draft.subject || !draft.email) {
      throw new Error("The flow response is missing a subject or email.");
    }

    return { success: true, data: draft };
  } catch (error) {
    let message = "Unknown error occurred";
    if (error instanceof Error) {
      message = error.message.includes("fetch failed")
        ? "Network error: unable to reach the Lamatic runtime. Check your connection and credentials."
        : error.message;
    }
    return { success: false, error: message };
  }
}
