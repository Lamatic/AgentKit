import { z } from "zod";

/**
 * Shared validation schema for the Impact Radius Reviewer form input.
 * Used on both the client (react-hook-form) and the server action, so the
 * two never drift apart.
 */
export const impactReviewSchema = z.object({
  diffcontextJson: z
    .string()
    .trim()
    .min(1, "The diffcontext compile --json output is required.")
    .max(200000, "The DiffContext JSON is too large."),

  prDiff: z
    .string()
    .trim()
    .min(1, "The PR diff is required.")
    .max(100000, "The PR diff is too large."),
});

/** Inferred TypeScript type for a validated Impact Radius Reviewer form submission. */
export type ImpactReviewFormInput = z.infer<typeof impactReviewSchema>;
