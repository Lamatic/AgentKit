import { z } from "zod";

export const severitySchema = z.enum(["critical", "serious", "moderate", "minor"]);
export const targetLevelSchema = z.enum(["A", "AA", "AAA"]);
export const wcagLevelSchema = z.union([targetLevelSchema, z.literal("best-practice")]);
export const overallRiskSchema = z.enum([
  "critical",
  "serious",
  "moderate",
  "minor",
  "no-supported-findings",
]);

export const auditResultSchema = z
  .object({
    auditSummary: z.object({
      pageTitle: z.string(),
      url: z.string(),
      targetLevel: targetLevelSchema,
      // These values are supplied by the model, but the canonical values are
      // derived from `findings` in the transform below.
      overallRisk: z.unknown().optional(),
      executiveSummary: z.string(),
      totalFindings: z.unknown().optional(),
      criticalCount: z.unknown().optional(),
      seriousCount: z.unknown().optional(),
      moderateCount: z.unknown().optional(),
      minorCount: z.unknown().optional(),
    }),
    findings: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          severity: severitySchema,
          confidence: z.enum(["high", "medium", "low"]),
          wcagCriterion: z.string(),
          wcagLevel: wcagLevelSchema,
          wcagPrinciple: z.enum(["Perceivable", "Operable", "Understandable", "Robust"]),
          affectedUsers: z.array(z.string()),
          selector: z.string(),
          evidence: z.string(),
          userImpact: z.string(),
          recommendation: z.string(),
          codeBefore: z.string(),
          codeAfter: z.string(),
          manualVerification: z.string(),
        }),
      )
      .max(8),
    manualChecks: z
      .array(
        z.object({
          title: z.string(),
          reason: z.string(),
          steps: z.array(z.string()),
        }),
      )
      .max(6),
    quickWins: z.array(z.string()),
    limitations: z.array(z.string()),
    disclaimer: z.string(),
  })
  .transform((audit) => {
    const counts: Record<z.infer<typeof severitySchema>, number> = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };
    for (const finding of audit.findings) counts[finding.severity] += 1;

    const overallRisk =
      severitySchema.options.find((severity) => counts[severity] > 0) ?? "no-supported-findings";

    return {
      ...audit,
      auditSummary: {
        ...audit.auditSummary,
        overallRisk,
        totalFindings: audit.findings.length,
        criticalCount: counts.critical,
        seriousCount: counts.serious,
        moderateCount: counts.moderate,
        minorCount: counts.minor,
      },
    };
  });

export type AuditResult = z.infer<typeof auditResultSchema>;
export type Severity = z.infer<typeof severitySchema>;

export const auditRequestSchema = z
  .object({
    mode: z.enum(["url", "html"]),
    url: z.string().trim().max(2048).optional().default(""),
    pageContent: z.string().max(100_000).optional().default(""),
    framework: z.enum(["html", "react", "nextjs"]),
    targetLevel: targetLevelSchema,
  })
  .superRefine((value, context) => {
    if (value.mode === "url" && !value.url) {
      context.addIssue({ code: "custom", path: ["url"], message: "Enter a public webpage URL." });
    }
    if (value.mode === "html" && value.pageContent.trim().length < 20) {
      context.addIssue({ code: "custom", path: ["pageContent"], message: "Paste at least 20 characters of HTML." });
    }
  });

export type AuditRequestInput = z.input<typeof auditRequestSchema>;
export type AuditRequest = z.output<typeof auditRequestSchema>;
