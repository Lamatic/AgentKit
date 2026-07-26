"use server";

import { getLamaticClient } from "@/lib/lamatic-client";
import { normalizeDossier, type Dossier } from "@/lib/dossier";

export interface ResearchInput {
  email: string;
  name: string;
  personContext?: string;
}

export async function researchPerson(
  input: ResearchInput
): Promise<{ success: boolean; data?: Dossier; error?: string }> {
  try {
    const workflowId = process.env.KNOW_THY_PERSON;
    if (!workflowId) throw new Error("Workflow ID not found in config.");

    const inputs = {
      email: input.email,
      name: input.name,
      person_context: input.personContext ?? "",
    };

    const lamaticClient = getLamaticClient();
    const resData = await lamaticClient.executeFlow(workflowId, inputs);
    // The flow maps the dossier fields flat onto `result` (identity, summary,
    // talkingPoints, ...). Some flows instead wrap it as `result.answer`; support both.
    const result = resData?.result as Record<string, unknown> | undefined;
    const dossier = result && "answer" in result && result.answer ? result.answer : result;
    if (!dossier || typeof dossier !== "object") {
      throw new Error("No dossier returned from the flow.");
    }

    return { success: true, data: normalizeDossier(dossier) };
  } catch (error) {
    let message = "Unknown error occurred";
    if (error instanceof Error) {
      message = error.message;
      if (message.includes("fetch failed"))
        message = "Network error: could not reach the research service.";
      else if (message.toLowerCase().includes("api key"))
        message = "Authentication error: check your API configuration.";
    }
    return { success: false, error: message };
  }
}
