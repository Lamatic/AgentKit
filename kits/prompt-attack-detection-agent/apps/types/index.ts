export interface PromptAnalysisInput {
  prompt: string;
}

export interface AttackAnalysis {
  risk_score: number;
  severity: string;
  attack_types: string[];
  explanation: string;
 recommendation: string;
  sanitized_prompt: string;
}

export interface PromptAnalysisOutput {
  analysis: AttackAnalysis;
  requestId?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: PromptAnalysisOutput;
  error?: string;
  timestamp?: string;
}