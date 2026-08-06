import {
  normalizePrioritization,
  parseArchitecture,
  parseIntakeResult,
  parsePrioritization,
  parseResearch,
  parseStride,
  validateIntakeInput,
} from "./contracts";
import type { GenerateReportResponse, IntakeInput } from "./types";

type ExecuteFlow = (
  stepId: string,
  input: Record<string, unknown>,
) => Promise<unknown>;

type PipelineDependencies = {
  execute: ExecuteFlow;
  today?: string;
};

function buildRoadmap(
  prioritization: ReturnType<typeof normalizePrioritization>,
): Record<string, unknown> {
  const actions = prioritization.ranked_threats.map((threat) => ({
    threat_id: threat.threat_id,
    title: threat.title,
    priority: threat.priority,
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

export async function runThreatModel(
  rawInput: IntakeInput,
  { execute, today = new Date().toISOString().slice(0, 10) }: PipelineDependencies,
): Promise<Exclude<GenerateReportResponse, { status: "error" }>> {
  const input = validateIntakeInput(rawInput);
  const intake = parseIntakeResult(
    await execute("intake", {
      message: input.systemDescription,
      today,
      session_state: JSON.stringify(input.sessionState ?? {}),
    }),
  );

  if (!intake.is_complete) {
    return {
      status: "needs_input",
      assistantMessage: intake.assistant_message,
      missingInfo: intake.missing_info,
      sessionState: intake.session_state,
    };
  }
  if (intake.missing_info.length > 0) {
    throw new Error("Intake marked incomplete information as complete.");
  }

  const architecture = parseArchitecture(
    await execute("decompose-architecture", {
      session_state: JSON.stringify(intake.session_state),
    }),
  );
  const stride = parseStride(
    await execute("stride-analyze", {
      architecture: JSON.stringify(architecture),
    }),
    architecture,
  );
  const research = parseResearch(
    await execute("threat-research", {
      architecture: JSON.stringify(architecture),
      stride_analysis: JSON.stringify(stride),
    }),
    stride,
  );
  const prioritization = normalizePrioritization(
    parsePrioritization(
      await execute("dread-prioritize", {
        stride_analysis: JSON.stringify(stride),
        research_findings: JSON.stringify(research),
      }),
      stride,
    ),
  );

  return {
    status: "complete",
    report: {
      architecture,
      stride,
      research,
      prioritization,
      roadmap: buildRoadmap(prioritization),
    },
  };
}
