import type {
  Architecture,
  IntakeResult,
  Prioritization,
  ResearchFindings,
  StrideAnalysis,
} from "./contracts";

export type IntakeInput = {
  systemDescription: string;
  sessionState?: IntakeResult["session_state"];
  accessToken?: string;
};

export type ThreatModelReport = {
  architecture: Architecture;
  stride: StrideAnalysis;
  research: ResearchFindings;
  prioritization: Prioritization;
  roadmap: Record<string, unknown>;
};

export type GenerateReportResponse =
  | { status: "complete"; report: ThreatModelReport }
  | {
      status: "needs_input";
      assistantMessage: string;
      missingInfo: string[];
      sessionState: IntakeResult["session_state"];
    }
  | { status: "error"; error: string };
