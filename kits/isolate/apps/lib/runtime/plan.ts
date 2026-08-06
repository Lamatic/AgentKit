import { z } from "zod";

const terminalReproductionPlanSchema = z.object({
  hypothesis: z.string().trim().min(1).max(2_000),
  candidateCommand: z.string().trim().min(1).max(4_000),
  controlCommand: z.string().trim().min(1).max(4_000),
});

const tuiUnsavedExitPlanSchema = z.object({
  mode: z.literal("tui_unsaved_exit"),
  hypothesis: z.string().trim().min(1).max(2_000),
  setupCommand: z.string().trim().min(1).max(4_000),
  command: z.string().trim().min(1).max(4_000),
});

export const reproductionPlanSchema = z.union([
  tuiUnsavedExitPlanSchema,
  terminalReproductionPlanSchema,
]);

export type ReproductionPlan = z.infer<typeof reproductionPlanSchema>;

/**
 * Parse a planner response into a validated reproduction plan, tolerating a
 * JSON string wrapped in a Markdown code fence.
 *
 * @throws when the response does not match either plan shape.
 */
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
