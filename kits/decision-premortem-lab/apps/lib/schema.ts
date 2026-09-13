import { z } from "zod";

const boundedText = (maximum: number) => z.string().max(maximum);
const levelSchema = z.enum(["low", "medium", "high"]);
const reportText = z.string().trim().min(1);

export const premortemInputSchema = z.object({
  decision: z
    .string()
    .trim()
    .min(20, "Describe the decision in at least 20 characters.")
    .max(4_000, "Keep the decision under 4,000 characters."),
  context: boundedText(8_000),
  constraints: boundedText(4_000),
  timeHorizon: boundedText(500),
});

export const premortemResultSchema = z.object({
  decisionSummary: reportText,
  assumptions: z.array(
    z.object({
      assumption: reportText,
      evidenceStatus: z.enum(["supported", "uncertain", "unsupported"]),
      rationale: reportText,
      fastestTest: reportText,
    }),
  ).min(1),
  failureModes: z.array(
    z.object({
      failureMode: reportText,
      likelihood: levelSchema,
      impact: levelSchema,
      warningSignals: z.array(reportText),
      mitigation: reportText,
      ownerRole: reportText,
    }),
  ).min(1),
  experiments: z.array(
    z.object({
      hypothesis: reportText,
      method: reportText,
      successMetric: reportText,
      stopCondition: reportText,
      estimatedEffort: reportText,
      timebox: reportText,
    }),
  ).min(1),
  recommendation: z.object({
    status: z.enum(["proceed", "pilot", "revise", "stop"]),
    rationale: reportText,
    confidence: levelSchema,
  }),
  nextActions: z.array(reportText).min(1),
});

export type PremortemInput = z.infer<typeof premortemInputSchema>;
export type PremortemResult = z.infer<typeof premortemResultSchema>;
