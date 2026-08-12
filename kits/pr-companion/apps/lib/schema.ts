import { z } from "zod";

/**
 * Shared validation schema for the PR Companion form input.
 * Used on both the client (react-hook-form) and the server action,
 * so the two never drift apart.
 */
export const prCompanionSchema = z.object({
  diffOrFiles: z
    .string()
    .trim()
    .min(1, "Diff or changed files is required.")
    .max(100000, "Diff or changed files is too large."),

  commitMessages: z
    .string()
    .trim()
    .min(1, "Commit messages are required.")
    .max(20000, "Commit messages are too large."),
  intent: z
    .string()
    .trim()
    .max(2000, "Intent is too large.")
    .optional()
    .default(""),
});

/** Inferred TypeScript type for a validated PR Companion form submission. */
export type PRCompanionFormInput = z.infer<typeof prCompanionSchema>;