import { z } from "zod";

export const reproductionPlanSchema = z.object({
  hypothesis: z.string().trim().min(1).max(2_000),
  candidateCommand: z.string().trim().min(1).max(4_000),
  controlCommand: z.string().trim().min(1).max(4_000),
});

export function parseReproductionPlan(value: unknown) {
  if (typeof value === "object" && value !== null) {
    return reproductionPlanSchema.parse(value);
  }
  if (typeof value !== "string") {
    throw new Error("Lamatic returned an invalid reproduction plan.");
  }

  const unwrapped = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return reproductionPlanSchema.parse(JSON.parse(unwrapped));
}
