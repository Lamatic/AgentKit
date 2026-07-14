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

const findingCountSchema = z.number().int().nonnegative();

export const auditResultSchema = z
  .object({
    auditSummary: z.object({
      pageTitle: z.string(),
      url: z.string(),
      targetLevel: targetLevelSchema,
      overallRisk: overallRiskSchema,
      executiveSummary: z.string(),
      totalFindings: findingCountSchema,
      criticalCount: findingCountSchema,
      seriousCount: findingCountSchema,
      moderateCount: findingCountSchema,
      minorCount: findingCountSchema,
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
  .superRefine((audit, context) => {
    const counts = {
      critical: audit.findings.filter((finding) => finding.severity === "critical").length,
      serious: audit.findings.filter((finding) => finding.severity === "serious").length,
      moderate: audit.findings.filter((finding) => finding.severity === "moderate").length,
      minor: audit.findings.filter((finding) => finding.severity === "minor").length,
    };

    const summaryCounts = {
      critical: audit.auditSummary.criticalCount,
      serious: audit.auditSummary.seriousCount,
      moderate: audit.auditSummary.moderateCount,
      minor: audit.auditSummary.minorCount,
    };

    if (audit.auditSummary.totalFindings !== audit.findings.length) {
      context.addIssue({
        code: "custom",
        path: ["auditSummary", "totalFindings"],
        message: "Total findings must match the findings array.",
      });
    }

    for (const severity of severitySchema.options) {
      if (summaryCounts[severity] !== counts[severity]) {
        context.addIssue({
          code: "custom",
          path: ["auditSummary", `${severity}Count`],
          message: `${severity}Count must match the findings array.`,
        });
      }
    }

    const expectedRisk =
      severitySchema.options.find((severity) => counts[severity] > 0) ?? "no-supported-findings";
    if (audit.auditSummary.overallRisk !== expectedRisk) {
      context.addIssue({
        code: "custom",
        path: ["auditSummary", "overallRisk"],
        message: "Overall risk must match the highest finding severity.",
      });
    }
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
