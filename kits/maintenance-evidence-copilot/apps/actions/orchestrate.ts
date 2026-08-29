"use server";

import lamaticConfig from "../../lamatic.config";
import { decodeAssessmentResponse, type Assessment } from "@/lib/assessment";
import { getLamaticClient } from "@/lib/lamatic-client";
import { isScenarioId, scenarios, type ScenarioId } from "@/lib/scenarios";

export type AssessmentActionResult =
  | { success: true; data: Assessment }
  | { success: false; error: string };

function resolveFlowId(): string {
  const step = lamaticConfig.steps.find((item) => item.id === "triage-maintenance-event");
  const envKey = step?.envKey;

  if (!envKey) {
    throw new Error("lamatic.config.ts is missing the triage-maintenance-event envKey.");
  }

  const flowId = process.env[envKey];
  if (!flowId) {
    throw new Error(`Missing required environment variable "${envKey}" for triage-maintenance-event.`);
  }

  return flowId;
}

function userFacingError(error: unknown): string {
  if (error instanceof Error && error.message.startsWith("Missing required environment variable")) {
    return error.message;
  }

  if (error instanceof Error && error.message.includes("assessmentJson")) {
    return "The deployed flow returned an assessment in an unexpected format.";
  }

  return "The maintenance assessment could not be run. Verify the local Lamatic configuration and deployed flow.";
}

export async function runMaintenanceAssessment(scenarioId: ScenarioId): Promise<AssessmentActionResult> {
  try {
    if (!isScenarioId(scenarioId)) {
      throw new Error("Unknown demonstration scenario.");
    }

    const response = await getLamaticClient().executeFlow(resolveFlowId(), scenarios[scenarioId].input);
    return { success: true, data: decodeAssessmentResponse(response) };
  } catch (error) {
    return { success: false, error: userFacingError(error) };
  }
}
