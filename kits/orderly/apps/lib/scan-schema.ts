// scan-schema.ts — the validated boundaries of this app.
//
// There are two, and they need opposite temperaments.
//
// **Inbound (`ScanRequestSchema`) is strict.** It guards a server action that
// spends money on a model call, so it rejects anything malformed loudly and
// early, with field-level errors the UI can attach to inputs.
//
// **Outbound-from-the-model (`FlowResultSchema`) is permissive.** A language
// model will eventually omit a field, return a number where a string was
// specified, or send back one dish instead of an array. None of that should
// produce a 500. Every optional field has a default, so a partial response
// degrades into a partial menu rather than an error page. The place to be
// strict about model output is the safety logic downstream, which already
// treats every field as a claim rather than a fact.

import { z } from "zod";
import { ALL_ALLERGENS } from "./types";

// ---------------------------------------------------------------------------
// Inbound — what the browser sends us
// ---------------------------------------------------------------------------

/** Built from the regulation list itself, so the two cannot diverge. */
export const AllergenIdSchema = z.enum(ALL_ALLERGENS);

export const DietIdSchema = z.enum([
  "vegetarian",
  "vegan",
  "halal",
  "gluten-free",
]);

export const DinerSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(64),
  avoidAllergens: z.array(AllergenIdSchema).max(14).default([]),
  diet: DietIdSchema.nullable().default(null),
  dislikes: z.array(z.string().min(1).max(64)).max(20).default([]),
});

export const BudgetSchema = z.object({
  amount: z.number().positive().finite(),
  currency: z.string().length(3),
});

export const ServingModelSchema = z.enum(["shared", "individual"]);

export const ScanRequestSchema = z.object({
  /**
   * A publicly-fetchable image URL. The vision node fetches this itself, so a
   * blob: or data: URL will not work — the app uploads to storage first.
   */
  imageUrl: z.string().url(),
  targetLanguage: z.string().min(2).max(32),
  sourceLanguageHint: z.string().max(32).optional(),
  /** Capped at 8: past that the greedy set cover stops being a good heuristic. */
  diners: z.array(DinerSchema).min(1).max(8),
  budget: BudgetSchema.nullable().default(null),
  servingModel: ServingModelSchema.default("shared"),
});

export type ScanRequest = z.infer<typeof ScanRequestSchema>;

export const DeepDiveRequestSchema = z.object({
  dishName: z.string().min(1).max(200),
  dishDescription: z.string().max(1000).default(""),
  targetLanguage: z.string().min(2).max(32),
  allergyContext: z.string().max(500).default(""),
});

export type DeepDiveRequest = z.infer<typeof DeepDiveRequestSchema>;

// ---------------------------------------------------------------------------
// Outbound — what the flow gives back
// ---------------------------------------------------------------------------

/**
 * Coerces a model-supplied value into a string.
 *
 * Models return `980` where `"980"` was asked for often enough that failing on
 * it would be a self-inflicted outage. `null` and `undefined` become `""`.
 */
const looseString = z.preprocess((value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return value;
}, z.string());

/**
 * Coerces a model-supplied value into a string array.
 *
 * Accepts a real array, a single string (wrapped), or a comma-separated string
 * (split) — all three are shapes models produce for a list field.
 */
const looseStringArray = z.preprocess((value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== null && entry !== undefined)
      .map((entry) => String(entry));
  }
  if (typeof value === "string") {
    return value.includes(",")
      ? value.split(",").map((part) => part.trim()).filter((part) => part !== "")
      : value.trim() === ""
        ? []
        : [value.trim()];
  }
  return [];
}, z.array(z.string()));

/** Normalises whatever the model said about legibility into our three states. */
const confidenceSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "medium";
  const normalized = value.toLowerCase().trim();
  if (normalized === "high" || normalized === "medium" || normalized === "unknown") {
    return normalized;
  }
  // "low" and anything unrecognised mean we should not trust the line.
  return normalized === "low" ? "unknown" : "medium";
}, z.enum(["high", "medium", "unknown"]));

export const RawDishSchema = z.object({
  nameOriginal: looseString.default(""),
  nameTransliterated: looseString.optional(),
  nameTranslated: looseString.optional(),
  description: looseString.optional(),
  likelyIngredients: looseStringArray.default([]),
  priceRaw: looseString.optional(),
  category: looseString.optional(),
  confidence: confidenceSchema.default("medium"),
});

/**
 * The `menu-scan` flow's result.
 *
 * Everything defaults. A response missing `dishes` yields an empty menu and an
 * honest "nothing could be read", which is a far better outcome than a parse
 * error the user cannot act on.
 */
export const FlowResultSchema = z.object({
  detectedLanguage: looseString.default("unknown"),
  currency: looseString.default(""),
  notes: looseString.default(""),
  dishes: z.array(RawDishSchema).default([]),
});

export type FlowResult = z.infer<typeof FlowResultSchema>;

export const DeepDiveResultSchema = z.object({
  explanation: looseString.default(""),
  crossContaminationNote: looseString.default(""),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses a flow result, never throwing.
 *
 * A model that returns something unparseable should degrade to an empty menu
 * with a note, not take down the request. Callers surface `notes` to the user.
 */
export function parseFlowResult(value: unknown): FlowResult {
  const parsed = FlowResultSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  return {
    detectedLanguage: "unknown",
    currency: "",
    notes: "The menu could not be interpreted. Try a clearer, straighter photo.",
    dishes: [],
  };
}

/**
 * Flattens a Zod error into `{ field: message }` for the UI.
 *
 * Only the first message per field is kept — showing a user four reasons one
 * input is wrong helps nobody.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in result)) result[path] = issue.message;
  }
  return result;
}
