// types/response.ts
// Full TypeScript interfaces matching the TrustGuard AI flow output schema

export interface InvestigationInfo {
  id: string;
  title: string;
  category: string;
  status: string;
  workflow: string;
  language: string;
}

export interface NormalizedContent {
  clean_text: string;
  summary: string;
  detected_input_type: string;
}

export interface EvidenceData {
  urls: string[];
  domains: string[];
  emails: string[];
  phone_numbers: string[];
  money_amounts: string[];
  brands: string[];
  urgency_phrases: string[];
  attachments: string[];
  languages: string[];
  entities: string[];
}

export interface ThreatIndicators {
  high: string[];
  medium: string[];
  low: string[];
}

export interface ThreatAnalysis {
  risk_score: number;
  confidence: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  indicators: ThreatIndicators;
  matched_patterns: string[];
  missing_information: string[];
  reasoning_summary: string;
}

export interface DecisionData {
  classification: string;
  final_verdict: string;
  recommended_action: string;
  decision_reason: string;
  priority: string;
  human_review: boolean;
}

export interface ResponseMetadata {
  workflow: string;
  version: string;
}

export interface InvestigationResponse {
  investigation: InvestigationInfo;
  normalized: NormalizedContent;
  evidence: EvidenceData;
  analysis: ThreatAnalysis;
  decision: DecisionData;
  metadata: ResponseMetadata;
}

// Input form shape
export type InputType = "Email" | "SMS" | "URL" | "Document" | "Text";
export type LanguageOption = "Auto" | "English" | "Hindi" | "Bengali";

export interface AnalyzeFormData {
  input_type: InputType;
  content: string;
  attachment_url: string;
  language: LanguageOption;
  memory_enabled: boolean;
}
