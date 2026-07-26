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
    const answer = resData?.result?.answer;
    if (!answer) throw new Error("No answer returned from the flow.");

    return { success: true, data: normalizeDossier(answer) };
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
