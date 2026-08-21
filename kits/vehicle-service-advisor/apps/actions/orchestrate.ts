"use server";

import lamaticConfig from "../../lamatic.config";
import type {
  AssessmentInput,
  AssessmentReport,
  AssessmentResult,
} from "@/features/assessment/types/assessment";
import {
  assessmentInputSchema,
  flowReportSchema,
  type FlowReport,
} from "@/features/assessment/validation/assessment-schema";
import { createLamaticClient } from "@/lib/lamatic-client";
import { reportServerError } from "@/lib/server-logger";

interface LamaticResponse {
  result?: { report?: unknown };
  report?: unknown;
  data?: { report?: unknown };
}

function getFlowId(): string {
  const envKey = lamaticConfig.steps[0].envKey;
  const flowId = process.env[envKey];
  if (!flowId) {
    throw new Error(`Missing required environment variable: ${envKey}`);
  }
  return flowId;
}

function getReportCandidate(response: LamaticResponse): unknown {
  return response.result?.report ?? response.report ?? response.data?.report;
}

function parseReportCandidate(candidate: unknown): FlowReport {
  if (typeof candidate !== "string") {
    return flowReportSchema.parse(candidate);
  }

  const normalized = candidate.replace(/^```json\s*|\s*```$/g, "").trim();
  return flowReportSchema.parse(JSON.parse(normalized));
}

function mapReport(report: FlowReport): AssessmentReport {
  return {
    summary: report.summary,
    urgency: report.urgency,
    stopDriving: report.stop_driving,
    confidence: report.confidence,
    safetyMessage: report.safety_message,
    possibleCauses: report.possible_causes,
    clarifyingQuestions: report.clarifying_questions,
    inspectionPlan: report.inspection_plan.map((step) => ({
      priority: step.priority,
      action: step.action,
      performedBy: step.performed_by,
      reason: step.reason,
    })),
    ownerActions: report.owner_actions,
    mechanicBrief: report.mechanic_brief,
    limitations: report.limitations,
  };
}

function mapFlowInput(input: AssessmentInput): Record<string, string> {
  return {
    make: input.make,
    model: input.model,
    year: input.year,
    mileage: input.mileage,
    fuel_type: input.fuelType,
    symptoms: input.symptoms,
    warning_lights: input.warningLights,
    recent_service: input.recentService,
    drivability: input.drivability,
  };
}

function toSafeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "The assessment could not be completed.";
  if (error.message.includes("environment variable")) {
    return "The Lamatic project is not configured yet. Add the required environment variables.";
  }
  if (error.message.toLowerCase().includes("api key")) {
    return "Lamatic authentication failed. Check the project API configuration.";
  }
  return "The assessment response was unavailable or invalid. Please try again.";
}

export async function assessVehicle(input: AssessmentInput): Promise<AssessmentResult> {
  try {
    const validatedInput = assessmentInputSchema.parse(input);
    const response = (await createLamaticClient().executeFlow(
      getFlowId(),
      mapFlowInput(validatedInput),
    )) as LamaticResponse;
    const report = parseReportCandidate(getReportCandidate(response));
    return { success: true, report: mapReport(report) };
  } catch (error) {
    reportServerError({
      operation: "assess_vehicle",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { success: false, error: toSafeErrorMessage(error) };
  }
}
