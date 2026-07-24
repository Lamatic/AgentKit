import { z } from "zod";

import { probeSpecSchema } from "./probe";

export const reproductionPlanSchema = z.object({
  hypothesis: z.string().trim().min(1).max(2_000),
  setupCommand: z.string().trim().max(4_000).default(""),
  candidateCommand: z.string().trim().min(1).max(4_000),
  candidateAssertions: probeSpecSchema.shape.assertions,
  controlCommand: z.string().trim().min(1).max(4_000),
  controlAssertions: probeSpecSchema.shape.assertions,
});

const forbiddenCommandPatterns = [
  /(^|[;&|]\s*)sudo\b/i,
  /\brm\s+-[^\n]*r[^\n]*f\b/i,
  /\bgit\s+push\b/i,
  /\b(?:npm|bun|pnpm|yarn)\s+(?:publish|login)\b/i,
  /\bcurl\b[^\n|]*\|\s*(?:ba)?sh\b/i,
  /\bwget\b[^\n|]*\|\s*(?:ba)?sh\b/i,
  /\b(?:env|printenv)\b/i,
  /(?:^|\s)(?:\.env|\.npmrc|\.git-credentials)(?:\s|$)/i,
];

export function assertSafeCommand(command: string) {
  if (forbiddenCommandPatterns.some((pattern) => pattern.test(command))) {
    throw new Error("The generated probe violated Isolate's command policy.");
  }
  return command;
}

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
