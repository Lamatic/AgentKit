// lib/types.ts
// Re-exports from types/response.ts for convenient imports.
// For runtime-validated types, import ValidatedInvestigationResponse from @/lib/schemas.
export type {
  InvestigationInfo,
  NormalizedContent,
  EvidenceData,
  ThreatIndicators,
  ThreatAnalysis,
  DecisionData,
  ResponseMetadata,
  InvestigationResponse,
  InputType,
  LanguageOption,
  AnalyzeFormData,
} from "@/types/response";
