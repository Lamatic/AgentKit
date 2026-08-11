"use server";

import { lamaticClient } from "../lib/lamatic-client";

export async function generateIncidentResponse(
  busNumber: string,
  currentRoute: string,
  affectedStop: string,
  incidentType: string,
  delay: string
) {
  try {
    const workflowId =
      process.env.TRANSIT_INCIDENT_RESPONSE_FLOW_ID;

    if (!workflowId) {
      throw new Error(
        "TRANSIT_INCIDENT_RESPONSE_FLOW_ID is not configured."
      );
    }

    const response = await lamaticClient.executeFlow(
      workflowId,
      {
        busNumber,
        currentRoute,
        affectedStop,
        incidentType,
        delay,
      }
    );

    console.log("Lamatic SDK response:", response);

    const result = response as any;

    const generatedResponse =
      result?.result?.generatedResponse ??
      result?.result?.answer ??
      result?.generatedResponse ??
      result;

    return {
      success: true,
      data: generatedResponse,
    };
  } catch (error) {
    console.error("Transit incident error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate incident response.",
    };
  }
}