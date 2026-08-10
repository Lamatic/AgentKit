"use server";

import lamaticConfig from "../../lamatic.config";
import { buildDemoReport } from "@/lib/demo";
import { getLamaticClient } from "@/lib/lamatic-client";
import { reliabilityReportSchema, webhookScenarioSchema } from "@/lib/schemas";
import type { AnalysisResult, ReliabilityReport } from "@/lib/types";

const FLOW_ENV_KEY =
  lamaticConfig.steps[0]?.envKey ?? "WEBHOOK_RELIABILITY_ARCHITECT_FLOW_ID";

function isReliabilityReport(value: unknown): value is ReliabilityReport {
  return reliabilityReportSchema.safeParse(value).success;
}

function normalizeReportCandidate(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.riskLevel !== "string") return value;

  return {
    ...candidate,
    riskLevel: candidate.riskLevel.toLowerCase(),
  };
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

  const normalizedRaw = normalizeReportCandidate(raw);
  if (isReliabilityReport(normalizedRaw)) return normalizedRaw;
  if (typeof raw !== "string") return null;

  try {
    const parsed = normalizeReportCandidate(JSON.parse(raw) as unknown);
    return isReliabilityReport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function analyzeWebhookScenario(
  scenario: unknown,
): Promise<AnalysisResult> {
  const parsedScenario = webhookScenarioSchema.safeParse(scenario);
  if (!parsedScenario.success) {
    return {
      success: false,
      error: parsedScenario.error.issues[0]?.message ?? "Invalid webhook scenario.",
    };
  }
  const validScenario = parsedScenario.data;

  if (process.env.DEMO_MODE === "true") {
    return { success: true, report: buildDemoReport(validScenario), mode: "demo" };
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
      scenario: JSON.stringify(validScenario),
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
