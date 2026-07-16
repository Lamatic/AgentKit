// lib/schemas.ts
// Zod runtime validation schema for the TrustGuard AI Lamatic flow response.
// This mirrors types/response.ts but enforces shape at runtime, not just compile time.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const InvestigationInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  status: z.string(),
  workflow: z.string(),
  language: z.string(),
});

const NormalizedContentSchema = z.object({
  clean_text: z.string(),
  summary: z.string(),
  detected_input_type: z.string(),
});

const EvidenceDataSchema = z.object({
  urls: z.array(z.string()).default([]),
  domains: z.array(z.string()).default([]),
  emails: z.array(z.string()).default([]),
  phone_numbers: z.array(z.string()).default([]),
  money_amounts: z.array(z.string()).default([]),
  brands: z.array(z.string()).default([]),
  urgency_phrases: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  entities: z.array(z.string()).default([]),
});

const ThreatIndicatorsSchema = z.object({
  high: z.array(z.string()).default([]),
  medium: z.array(z.string()).default([]),
  low: z.array(z.string()).default([]),
});

const ThreatAnalysisSchema = z.object({
  risk_score: z.number(),
  confidence: z.number(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).catch("LOW"),
  indicators: ThreatIndicatorsSchema,
  matched_patterns: z.array(z.string()).default([]),
  missing_information: z.array(z.string()).default([]),
  reasoning_summary: z.string(),
});

const DecisionDataSchema = z.object({
  classification: z.string(),
  final_verdict: z.string(),
  recommended_action: z.string(),
  decision_reason: z.string(),
  priority: z.string(),
  human_review: z.boolean(),
});

const ResponseMetadataSchema = z.object({
  workflow: z.string(),
  version: z.string(),
});

// ---------------------------------------------------------------------------
// Root schema — exported for use in the Server Action
// ---------------------------------------------------------------------------

export const InvestigationResponseSchema = z.object({
  investigation: InvestigationInfoSchema,
  normalized: NormalizedContentSchema,
  evidence: EvidenceDataSchema,
  analysis: ThreatAnalysisSchema,
  decision: DecisionDataSchema,
  metadata: ResponseMetadataSchema,
});

// Inferred TypeScript type from the Zod schema.
// Components should import this type from here instead of types/response.ts
// when they need the guaranteed-validated shape.
export type ValidatedInvestigationResponse = z.infer<
  typeof InvestigationResponseSchema
>;
