"use server";

import { getLamaticClient } from "@/lib/lamatic-client";
import { buildDemoNotes } from "@/lib/demo";
import lamaticConfig from "../../lamatic.config";

// Single source of truth: the flow's env var name comes from the kit metadata.
const ENV_KEY = lamaticConfig.steps[0]?.envKey ?? "RELEASE_NOTES_GENERATOR";

export interface GenerateInput {
  changes: string;
  version?: string;
  date?: string;
}

export interface GenerateResult {
  success: boolean;
  releaseNotes?: string;
  error?: string;
}

/**
 * Invoke the deployed `release-notes-generator` Lamatic flow and return the
 * generated Markdown release notes.
 */
export async function generateReleaseNotes(input: GenerateInput): Promise<GenerateResult> {
  const changes = input.changes?.trim();
  if (!changes) {
    return { success: false, error: "Please paste at least one PR title or commit message." };
  }

  // Opt-in demo mode: explore the UI without a deployed flow or credentials.
  if (process.env.DEMO_MODE === "true") {
    return { success: true, releaseNotes: buildDemoNotes(input.version, input.date) };
  }

  const flowId = process.env[ENV_KEY];
  if (!flowId) {
    return {
      success: false,
      error: `${ENV_KEY} flow ID is not set. Add it to apps/.env.local.`,
    };
  }

  try {
    const client = getLamaticClient();

    const response = await client.executeFlow(flowId, {
      changes,
      version: input.version?.trim() ?? "",
      date: input.date?.trim() ?? "",
    });

    const releaseNotes = (response as { result?: { releaseNotes?: string } })?.result?.releaseNotes;

    if (!releaseNotes) {
      return { success: false, error: "The flow returned an empty response. Check the flow in Lamatic Studio." };
    }

    return { success: true, releaseNotes };
  } catch (error) {
    let message = "Unknown error occurred.";
    if (error instanceof Error) {
      message = error.message;
      if (message.includes("fetch failed")) {
        message = "Network error: could not reach Lamatic. Check your connection and LAMATIC_API_URL.";
      } else if (message.toLowerCase().includes("api key") || message.includes("401")) {
        message = "Authentication error: check LAMATIC_API_KEY and LAMATIC_PROJECT_ID.";
      }
    }
    return { success: false, error: message };
  }
}
