import { z } from "zod";

export const investigationReportSchema = z.object({
  assessment: z.enum(["likely_reproduced", "not_reproduced", "inconclusive"]),
  summary: z.string().trim().min(1).max(2_000),
  expectedBehavior: z.string().trim().min(1).max(2_000),
  actualBehavior: z.string().trim().min(1).max(4_000),
  reproductionSteps: z.array(z.string().trim().min(1).max(1_000)).min(1).max(10),
  evidence: z.array(z.string().trim().min(1).max(2_000)).min(1).max(10),
  limitations: z.array(z.string().trim().min(1).max(2_000)).max(10),
  markdown: z.string().trim().min(1).max(20_000),
});

export type InvestigationReport = z.infer<typeof investigationReportSchema>;

export function parseInvestigationReport(value: unknown) {
  const normalizeLegacyOutcome = (report: unknown) => {
    if (typeof report !== "object" || report === null || !("outcome" in report)) {
      return report;
    }
    const { outcome, ...rest } = report as Record<string, unknown>;
    return { ...rest, assessment: outcome };
  };
  if (typeof value === "object" && value !== null) {
    const wrapped = value as { report?: unknown };
    return investigationReportSchema.parse(
      normalizeLegacyOutcome(wrapped.report ?? value),
    );
  }
  if (typeof value !== "string") {
    throw new Error("Lamatic returned an invalid investigation report.");
  }
  const unwrapped = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = JSON.parse(unwrapped) as { report?: unknown };
  return investigationReportSchema.parse(
    normalizeLegacyOutcome(parsed.report ?? parsed),
  );
}
