import type { UrgencyLevel } from "./deadline-urgency";

export type DenialCategory = "medical-necessity" | "administrative" | "coverage" | "other";

export interface AppealResult {
  denialCategory: DenialCategory;
  claimNumber: string | null;
  denialReasonText: string;
  appealDeadline: string | null;
  daysRemaining: number | null;
  urgencyLevel: UrgencyLevel;
  appealLetter: string;
  strengthScore: number;
  missingEvidence: string[];
  rationale: string;
}

export interface AnalyzeDenialResponse {
  success: boolean;
  data?: AppealResult;
  error?: string;
  demoMode?: boolean;
}
