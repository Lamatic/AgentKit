import { z } from "zod";

/**
 * Shared validation schema for the Impact Radius Reviewer form input.
 * Used on both the client (react-hook-form) and the server action, so the
 * two never drift apart.
 *
 * `diffcontextJson` is validated as parseable JSON whose top-level value is an
 * object containing the DiffContext contract fields, so malformed input is
 * rejected before the flow is invoked (the code node would otherwise emit a
 * `DIFFCONTEXT PARSE ERROR` brief to the LLM).
 */
export const impactReviewSchema = z.object({
  diffcontextJson: z
    .string()
    .trim()
    .min(1, "The diffcontext compile --json output is required.")
    .max(200000, "The DiffContext JSON is too large.")
    .refine(
      (value) => {
        try {
          const parsed = JSON.parse(value);
          return (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          );
        } catch {
          return false;
        }
      },
      "DiffContext JSON must be a JSON object (run `diffcontext compile --json`)."
    )
    .refine(
      (value) => {
        try {
          const parsed = JSON.parse(value) as Record<string, unknown>;
          return (
            "included_symbols" in parsed &&
            "dropped_symbols" in parsed &&
            "context" in parsed
          );
        } catch {
          return false;
        }
      },
      "DiffContext JSON is missing required fields (included_symbols, dropped_symbols, context)."
    ),

  prDiff: z
    .string()
    .trim()
    .min(1, "The PR diff is required.")
    .max(100000, "The PR diff is too large."),
});

/** Inferred TypeScript type for a validated Impact Radius Reviewer form submission. */
export type ImpactReviewFormInput = z.infer<typeof impactReviewSchema>;
