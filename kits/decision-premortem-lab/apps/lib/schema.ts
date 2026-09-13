import { z } from "zod";

const boundedText = (maximum: number) => z.string().max(maximum);
const levelSchema = z.enum(["low", "medium", "high"]);

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
  decisionSummary: z.string(),
  assumptions: z.array(
    z.object({
      assumption: z.string(),
      evidenceStatus: z.enum(["supported", "uncertain", "unsupported"]),
      rationale: z.string(),
      fastestTest: z.string(),
    }),
  ),
  failureModes: z.array(
    z.object({
      failureMode: z.string(),
      likelihood: levelSchema,
      impact: levelSchema,
      warningSignals: z.array(z.string()),
      mitigation: z.string(),
      ownerRole: z.string(),
    }),
  ),
  experiments: z.array(
    z.object({
      hypothesis: z.string(),
      method: z.string(),
      successMetric: z.string(),
      stopCondition: z.string(),
      estimatedEffort: z.string(),
      timebox: z.string(),
    }),
  ),
  recommendation: z.object({
    status: z.enum(["proceed", "pilot", "revise", "stop"]),
    rationale: z.string(),
    confidence: levelSchema,
  }),
  nextActions: z.array(z.string()),
});

export type PremortemInput = z.infer<typeof premortemInputSchema>;
export type PremortemResult = z.infer<typeof premortemResultSchema>;
