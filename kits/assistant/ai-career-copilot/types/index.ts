export interface CareerAnalysisInput {
  resume_text: string;
  domain: string;
}

export interface CareerAnalysisOutput {
  skills: string[];
  missing_skills: string[];
  roles: string[];
  readiness_score: number;
  roadmap: string[];
  projects: string[];
  interview_questions: string[];
}

export interface ApiResponse {
  success: boolean;
  data?: CareerAnalysisOutput;
  error?: string;
  timestamp?: string;
}