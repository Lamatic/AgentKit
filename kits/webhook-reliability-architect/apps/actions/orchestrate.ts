"use server";

import lamaticConfig from "../../lamatic.config";
import { buildDemoReport } from "@/lib/demo";
import { getLamaticClient } from "@/lib/lamatic-client";
import type { AnalysisResult, ReliabilityReport, WebhookScenario } from "@/lib/types";

const FLOW_ENV_KEY =
  lamaticConfig.steps[0]?.envKey ?? "WEBHOOK_RELIABILITY_ARCHITECT_FLOW_ID";

function validateScenario(scenario: WebhookScenario): string | null {
  if (!scenario.systemName.trim()) return "System name is required.";
  if (!scenario.eventType.trim()) return "Event type is required.";
  if (scenario.maxAttempts < 1 || scenario.maxAttempts > 12) {
    return "Max attempts must be between 1 and 12.";
  }
  if (scenario.timeoutSeconds < 1 || scenario.timeoutSeconds > 300) {
    return "Timeout must be between 1 and 300 seconds.";
  }
  if (scenario.maxDeliveryAgeMinutes < 1 || scenario.maxDeliveryAgeMinutes > 10_080) {
    return "Delivery age must be between 1 minute and 7 days.";
  }
  if (scenario.samplePayload.length > 20_000) return "Sample payload is too large.";
  if (scenario.currentSafeguards.length > 8_000) return "Safeguard notes are too large.";
  if (scenario.failureContext.length > 8_000) return "Failure context is too large.";
  return null;
}

function isReliabilityReport(value: unknown): value is ReliabilityReport {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ReliabilityReport>;
  return (
    typeof candidate.executiveSummary === "string" &&
    typeof candidate.riskScore === "number" &&
    typeof candidate.riskLevel === "string" &&
    Boolean(candidate.idempotencyPlan) &&
    Boolean(candidate.retryPlan) &&
    Array.isArray(candidate.failureModes) &&
    Array.isArray(candidate.testMatrix)
  );
}

function parseReport(response: unknown): ReliabilityReport | null {
  const envelope = response as {
    result?: { analysis?: unknown; report?: unknown };
    analysis?: unknown;
    report?: unknown;
  };
  const raw =
    envelope?.result?.analysis ??
    envelope?.result?.report ??
    envelope?.analysis ??
    envelope?.report;

  if (isReliabilityReport(raw)) return raw;
  if (typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isReliabilityReport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function analyzeWebhookScenario(
  scenario: WebhookScenario,
): Promise<AnalysisResult> {
  const validationError = validateScenario(scenario);
  if (validationError) return { success: false, error: validationError };

  if (process.env.DEMO_MODE === "true") {
    return { success: true, report: buildDemoReport(scenario), mode: "demo" };
  }

  const flowId = process.env[FLOW_ENV_KEY];
  if (!flowId) {
    return {
      success: false,
      error: `${FLOW_ENV_KEY} is not configured. Set it in apps/.env.local or enable DEMO_MODE.`,
    };
  }

  try {
    const client = getLamaticClient();
    const response = await client.executeFlow(flowId, {
      scenario: JSON.stringify(scenario),
    });
    const report = parseReport(response);
    if (!report) {
      return {
        success: false,
        error: "Lamatic returned an unexpected response shape. Verify the deployed flow output schema.",
      };
    }
    return { success: true, report, mode: "live" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Lamatic error.";
    return { success: false, error: message };
  }
}
