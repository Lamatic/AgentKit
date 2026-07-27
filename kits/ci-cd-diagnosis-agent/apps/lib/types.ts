import { z } from "zod";

// ─── Inbound request ────────────────────────────────────────────────────────

export const DiagnoseRequestSchema = z.object({
  logContent: z
    .string()
    .min(10, "Log content is too short to diagnose.")
    .max(5_000_000, "Log content exceeds the 5 MB limit."),
  ciProvider: z.enum(["github", "gitlab"]).default("github"),
});

export type DiagnoseRequest = z.infer<typeof DiagnoseRequestSchema>;

// ─── Fix snippet ─────────────────────────────────────────────────────────────

export const FixSnippetSchema = z.object({
  description: z.string(),
  language: z.string(),
  code: z.string(),
});

export type FixSnippet = z.infer<typeof FixSnippetSchema>;

// ─── Full diagnosis response ─────────────────────────────────────────────────

export const DiagnosisSchema = z.object({
  metadata: z.object({
    job_id: z.string(),
    timestamp: z.string(),
    ci_provider: z.string(),
  }),
  classification: z.object({
    category: z.string(),
    sub_category: z.string().optional(),
    confidence_score: z.number().min(0).max(1),
  }),
  analysis: z.object({
    root_cause_summary: z.string(),
    detailed_explanation: z.string(),
    evidence_cited: z.array(z.string()),
  }),
  resolution: z.object({
    is_fix_valid: z.boolean(),
    verification_notes: z.string(),
    fixes: z.array(FixSnippetSchema),
    security_warnings: z.string().optional(),
  }),
  risk: z.object({
    level: z.enum(["Low", "Medium", "High", "Unknown"]),
    warning: z.string().optional(),
  }),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;

// ─── API error ───────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string;
}
