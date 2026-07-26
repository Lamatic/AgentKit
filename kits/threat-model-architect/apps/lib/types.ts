export type IntakeInput = {
  systemDescription: string;
};

export type ThreatModelReport = {
  architecture: Record<string, unknown>;
  stride: Record<string, unknown>;
  research: Record<string, unknown>;
  prioritization: Record<string, unknown>;
  roadmap: Record<string, unknown>;
};

export type GenerateReportResponse =
  | { success: true; report: ThreatModelReport }
  | { success: false; error: string };
