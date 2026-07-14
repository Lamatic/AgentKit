import { z } from "zod";

export const severitySchema = z.enum(["critical", "serious", "moderate", "minor"]);

export const auditResultSchema = z.object({
  auditSummary: z.object({
    pageTitle: z.string(),
    url: z.string(),
    targetLevel: z.string(),
    overallRisk: z.string(),
    executiveSummary: z.string(),
    totalFindings: z.number(),
    criticalCount: z.number(),
    seriousCount: z.number(),
    moderateCount: z.number(),
    minorCount: z.number(),
  }),
  findings: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: severitySchema,
      confidence: z.enum(["high", "medium", "low"]),
      wcagCriterion: z.string(),
      wcagLevel: z.string(),
      wcagPrinciple: z.string(),
      affectedUsers: z.array(z.string()),
      selector: z.string(),
      evidence: z.string(),
      userImpact: z.string(),
      recommendation: z.string(),
      codeBefore: z.string(),
      codeAfter: z.string(),
      manualVerification: z.string(),
    }),
  ),
  manualChecks: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
      steps: z.array(z.string()),
    }),
  ),
  quickWins: z.array(z.string()),
  limitations: z.array(z.string()),
  disclaimer: z.string(),
});

export type AuditResult = z.infer<typeof auditResultSchema>;
export type Severity = z.infer<typeof severitySchema>;

export const auditRequestSchema = z
  .object({
    mode: z.enum(["url", "html"]),
    url: z.string().trim().max(2048).optional().default(""),
    pageContent: z.string().max(100_000).optional().default(""),
    framework: z.enum(["html", "react", "nextjs"]),
    targetLevel: z.enum(["A", "AA", "AAA"]),
  })
  .superRefine((value, context) => {
    if (value.mode === "url" && !value.url) {
      context.addIssue({ code: "custom", path: ["url"], message: "Enter a public webpage URL." });
    }
    if (value.mode === "html" && value.pageContent.trim().length < 20) {
      context.addIssue({ code: "custom", path: ["pageContent"], message: "Paste at least 20 characters of HTML." });
    }
  });
