"use server";

import { executeFlow } from "@/lib/lamatic-client";
import type {
  GenerateReportResponse,
  IntakeInput,
  ThreatModelReport,
} from "@/lib/types";

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value), label);
    } catch {
      throw new Error(`${label} was not valid JSON.`);
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} was missing from the workflow response.`);
  }
  return value as Record<string, unknown>;
}

function stringify(value: Record<string, unknown>) {
  return JSON.stringify(value);
}

function buildRoadmap(prioritization: Record<string, unknown>): Record<string, unknown> {
  const rankedThreats = Array.isArray(prioritization.ranked_threats)
    ? prioritization.ranked_threats.filter(
        (threat): threat is Record<string, unknown> =>
          Boolean(threat) && typeof threat === "object" && !Array.isArray(threat),
      )
    : [];
  const ordered = [...rankedThreats].sort(
    (left, right) => Number(right.total ?? 0) - Number(left.total ?? 0),
  );
  const actions = ordered.map((threat, index) => ({
    threat_id: String(threat.threat_id ?? `threat-${index + 1}`),
    title: String(threat.title ?? "Prioritized security threat"),
    priority: String(threat.priority ?? "unclassified"),
    owner_role: "Application security and service owner",
    action:
      "Validate the stated assumptions, implement the listed mitigations, and add a regression test before closing the risk.",
  }));

  return {
    report_title: "Security remediation roadmap",
    executive_summary:
      "This deterministic roadmap is derived from DREAD-ranked threats. Validate assumptions with the system owners before committing remediation work.",
    immediate_actions: actions.slice(0, 2),
    days_30: actions.slice(2, 5),
    days_60: [
      "Add automated authorization, authentication, and tenant-isolation regression tests.",
      "Centralize security logging and alerting for high-risk API actions.",
    ],
    days_90: [
      "Run a threat-model review after material architecture changes.",
      "Measure remediation completion and review remaining risk assumptions.",
    ],
    threat_mitigations: actions,
  };
}

export async function generateThreatModel(input: IntakeInput): Promise<GenerateReportResponse> {
  const message = input.systemDescription.trim();
  if (!message) return { success: false, error: "Describe the system to begin analysis." };

  try {
    const intake = await executeFlow<Record<string, unknown>>("INTAKE_FLOW_ID", {
      message,
      today: new Date().toISOString().slice(0, 10),
      session_state: "{}",
    });
    const intakeState = asRecord(intake.session_state, "Intake session state");
    const architecture = await executeFlow<Record<string, unknown>>("DECOMPOSE_FLOW_ID", {
      session_state: stringify(intakeState),
    });
    const stride = await executeFlow<Record<string, unknown>>("STRIDE_FLOW_ID", {
      architecture: stringify(architecture),
    });
    const research = await executeFlow<Record<string, unknown>>("RESEARCH_FLOW_ID", {
      architecture: stringify(architecture),
      stride_analysis: stringify(stride),
    });
    const prioritization = await executeFlow<Record<string, unknown>>("DREAD_FLOW_ID", {
      stride_analysis: stringify(stride),
      research_findings: stringify(research),
    });
    const roadmap = buildRoadmap(prioritization);
    const report: ThreatModelReport = {
      architecture,
      stride,
      research,
      prioritization,
      roadmap,
    };
    return { success: true, report };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to generate the threat model.",
    };
  }
}
