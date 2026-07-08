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
  // Server-side validation — a direct caller can bypass the client-side checks.
  const name = input.name?.trim();
  const company = input.company?.trim();
  const website = input.website?.trim();
  if (!name || !company || !website) {
    return { success: false, error: "Name, company, and website are required." };
  }
  try {
    new URL(website);
  } catch {
    return { success: false, error: "Website must be a valid URL (e.g. https://acme.com)." };
  }

  try {
    // workflowId presence is already guaranteed by the module-level guard in lamatic-client.ts
    const workflowId = config.flows["lead-outreach-agent"].workflowId;

    const res = await lamaticClient.executeFlow(workflowId, {
      name,
      company,
      website,
      tone: input.tone,
    });

    const answer = (res as { result?: { answer?: unknown } })?.result?.answer;
    if (!answer) {
      throw new Error("No answer returned from the flow.");
    }

    let draft: OutreachDraft;
    if (typeof answer === "string") {
      try {
        draft = JSON.parse(answer) as OutreachDraft;
      } catch {
        throw new Error("The flow returned an invalid response format. Please try again.");
      }
    } else {
      draft = answer as OutreachDraft;
    }

    if (!draft.subject || !draft.email || !draft.followUp) {
      throw new Error("The flow response is missing a subject, email, or follow-up.");
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
