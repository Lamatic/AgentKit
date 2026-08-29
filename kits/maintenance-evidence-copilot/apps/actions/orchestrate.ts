"use server";

import lamaticConfig from "../../lamatic.config";
import { userFacingAssessmentError } from "@/lib/assessment-action-error";
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

export async function runMaintenanceAssessment(scenarioId: ScenarioId): Promise<AssessmentActionResult> {
  try {
    if (!isScenarioId(scenarioId)) {
      throw new Error("Unknown demonstration scenario.");
    }

    const response = await getLamaticClient().executeFlow(resolveFlowId(), scenarios[scenarioId].input);
    return { success: true, data: decodeAssessmentResponse(response) };
  } catch (error) {
    return { success: false, error: userFacingAssessmentError(error) };
  }
}
