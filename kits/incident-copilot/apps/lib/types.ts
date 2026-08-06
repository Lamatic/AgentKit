// Shared types for Incident Copilot. These mirror the `investigate` flow's
// structured output schema and the `draft-comms` flow's response.

export type Confidence = "high" | "medium" | "low";

export interface Hypothesis {
  rank: number;
  title: string;
  confidence: Confidence;
  reasoning: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  nextStep: string;
}

export interface InvestigationResult {
  summary: string;
  insufficientInfo: boolean;
  hypotheses: Hypothesis[];
}

export interface CommsResult {
  slackUpdate: string;
  postmortem: string;
}

export interface InvestigateInput {
  alertText: string;
  incidentId: string;
  repoUrl?: string;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
