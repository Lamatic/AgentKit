"use server";

import { executePostmortemFlow } from "@/lib/lamatic-client";
import type { GeneratePostmortemResponse, IncidentInput } from "@/lib/types";

function cleanInput(input: IncidentInput): IncidentInput {
  return {
    service_name: input.service_name.trim(),
    incident_title: input.incident_title.trim(),
    alert_details: input.alert_details.trim(),
    logs_or_symptoms: input.logs_or_symptoms.trim(),
    timeline_notes: input.timeline_notes.trim(),
    impact_description: input.impact_description.trim(),
    current_status: input.current_status.trim(),
  };
}

export async function generatePostmortem(
  input: IncidentInput,
): Promise<GeneratePostmortemResponse> {
  const cleaned = cleanInput(input);

  if (!cleaned.service_name) {
    return { success: false, error: "Service name is required." };
  }

  if (!cleaned.incident_title) {
    return { success: false, error: "Incident title is required." };
  }

  try {
    const postmortem = await executePostmortemFlow(cleaned);
    return {
      success: true,
      postmortem,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate the postmortem.",
    };
  }
}
