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

/**
 * Hostnames and address forms that must never be handed to the vision node.
 *
 * The flow fetches `menuImage` server-side, so an unvalidated URL turns this
 * app into a request proxy: a caller could aim it at a cloud metadata endpoint,
 * a service on the loopback interface, or something inside a private network
 * and learn from the response or the timing. Restricting the scheme to HTTPS
 * and rejecting non-public hosts closes the obvious paths.
 */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

/** IPv4/IPv6 forms that are loopback, private, link-local, or unspecified. */
const BLOCKED_IP_PATTERNS: readonly RegExp[] = [
  /^127\./, // loopback
  /^10\./, // private class A
  /^192\.168\./, // private class C
  /^172\.(1[6-9]|2\d|3[01])\./, // private class B
  /^169\.254\./, // link-local, incl. cloud metadata at 169.254.169.254
  /^0\./, // unspecified
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // carrier-grade NAT
  /^::1?$/, // IPv6 loopback / unspecified
  /^fe80:/i, // IPv6 link-local
  /^f[cd][0-9a-f]{2}:/i, // IPv6 unique-local
];

/**
 * Extracts the IPv4 address embedded in an IPv4-mapped IPv6 host, or `null`.
 *
 * This exists because the blocklist above can be walked straight past
 * otherwise. `https://[::ffff:127.0.0.1]/` is loopback, but `URL` normalises
 * the host to the hexadecimal form `::ffff:7f00:1`, which matches no IPv4
 * pattern and does not begin with `fe80` or `fc00`. Both the dotted and
 * hexadecimal spellings are decoded here so the embedded address can be tested
 * as the IPv4 address it actually is.
 */
export function embeddedIPv4(hostname: string): string | null {
  const lower = hostname.toLowerCase();
  const marker = lower.lastIndexOf("ffff:");
  if (marker === -1) return null;

  // Everything before the marker must be the all-zero prefix of a mapped
  // address, in either the "::" or the "0:0:0:0:0:" spelling.
  if (!/^[0:]*$/.test(lower.slice(0, marker))) return null;

  const tail = lower.slice(marker + "ffff:".length);

  // Dotted spelling: ::ffff:127.0.0.1
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(tail)) return tail;

  // Hexadecimal spelling: ::ffff:7f00:1
  const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(tail);
  if (hex !== null) {
    const high = Number.parseInt(hex[1], 16);
    const low = Number.parseInt(hex[2], 16);
    return [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255].join(".");
  }

  return null;
}

/**
 * Validates that a URL is something safe to ask a remote service to fetch.
 *
 * Exported so the same rule can be reused and tested independently of the
 * request schema.
 */
export function isPubliclyFetchableImageUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  // HTTPS only. This also rejects blob:, data: and file:, none of which a
  // remote fetcher can resolve anyway.
  if (url.protocol !== "https:") return false;

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (hostname === "") return false;
  if (BLOCKED_HOSTNAMES.has(hostname)) return false;
  if (hostname.endsWith(".localhost") || hostname.endsWith(".internal")) return false;
  if (BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(hostname))) return false;

  // An IPv4-mapped IPv6 host is judged on the address it actually carries.
  const mapped = embeddedIPv4(hostname);
  if (mapped !== null && BLOCKED_IP_PATTERNS.some((p) => p.test(mapped))) {
    return false;
  }

  return true;
}

export const ImageUrlSchema = z
  .string()
  .url()
  .refine(isPubliclyFetchableImageUrl, {
    message:
      "Must be a public https:// image URL. Local, private-network, and blob:/data: URLs cannot be fetched by the vision model.",
  });

export const ScanRequestSchema = z.object({
  /**
   * A publicly-fetchable image URL. The vision node fetches this itself, so a
   * blob: or data: URL will not work — the app uploads to storage first.
   */
  imageUrl: ImageUrlSchema,
  targetLanguage: z.string().min(2).max(32),
  sourceLanguageHint: z.string().max(32).optional(),
  /** Capped at 8: past that the greedy set cover stops being a good heuristic. */
  diners: z
    .array(DinerSchema)
    .min(1)
    .max(8)
    // The solver keys coverage off diner IDs in a Set, so duplicates would make
    // two people silently count as one and leave someone unfed without saying so.
    .refine(
      (diners) => new Set(diners.map((d) => d.id)).size === diners.length,
      { message: "Each diner must have a unique id." }
    ),
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
