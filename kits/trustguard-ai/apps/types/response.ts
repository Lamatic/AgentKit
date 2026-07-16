// types/response.ts
// Full TypeScript interfaces matching the TrustGuard AI flow output schema.
// NOTE: For runtime-validated types, prefer ValidatedInvestigationResponse
// from @/lib/schemas (Zod-inferred). These interfaces remain for components
// that receive already-validated data.

export interface InvestigationInfo {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly status: string;
  readonly workflow: string;
  readonly language: string;
}

export interface NormalizedContent {
  readonly clean_text: string;
  readonly summary: string;
  readonly detected_input_type: string;
}

export interface EvidenceData {
  readonly urls: readonly string[];
  readonly domains: readonly string[];
  readonly emails: readonly string[];
  readonly phone_numbers: readonly string[];
  readonly money_amounts: readonly string[];
  readonly brands: readonly string[];
  readonly urgency_phrases: readonly string[];
  readonly attachments: readonly string[];
  readonly languages: readonly string[];
  readonly entities: readonly string[];
}

export interface ThreatIndicators {
  readonly high: readonly string[];
  readonly medium: readonly string[];
  readonly low: readonly string[];
}

export interface ThreatAnalysis {
  readonly risk_score: number;
  readonly confidence: number;
  /** Discriminated severity union — use Zod schema for runtime unknown values. */
  readonly severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  readonly indicators: ThreatIndicators;
  readonly matched_patterns: readonly string[];
  readonly missing_information: readonly string[];
  readonly reasoning_summary: string;
}

export interface DecisionData {
  readonly classification: string;
  readonly final_verdict: string;
  readonly recommended_action: string;
  readonly decision_reason: string;
  readonly priority: string;
  readonly human_review: boolean;
}

export interface ResponseMetadata {
  readonly workflow: string;
  readonly version: string;
}

export interface InvestigationResponse {
  readonly investigation: InvestigationInfo;
  readonly normalized: NormalizedContent;
  readonly evidence: EvidenceData;
  readonly analysis: ThreatAnalysis;
  readonly decision: DecisionData;
  readonly metadata: ResponseMetadata;
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
