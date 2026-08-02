// keyword-match.ts — the text matcher shared by every rule table in this app.
//
// Both the allergen table and the diet rules answer the same question: "does
// this text mention one of these things?" Getting that question right once, in
// one place, is the difference between a safety claim that can be audited and a
// pile of ad-hoc `.includes()` calls.
//
// The matcher is intentionally conservative. It matches whole words only, so it
// will occasionally miss a novel compound; the fix for that is to add the
// compound to the relevant table as its own key, not to loosen the matcher.
// Loosening it would trade a visible false negative for an invisible false
// positive, and false positives here mean telling someone a dish is unsafe when
// it is fine — which erodes the trust that makes the safe/unsafe call useful.

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/**
 * Canonicalises text before matching.
 *
 * Lowercases; converts the separators that commonly stand in for spaces in
 * scraped menu text (`soy-sauce`, `soy_sauce`, `soy/sauce`, `soy,sauce`) into
 * real spaces; collapses whitespace runs; trims.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_/,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Pattern construction
// ---------------------------------------------------------------------------

/** Escapes regex metacharacters so table keys are matched literally. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compiled patterns, cached across calls. Tables are module-level constants, so
 * the same few hundred keys are compiled once for the lifetime of the process.
 */
const PATTERN_CACHE = new Map<string, RegExp>();

/**
 * Builds `\b<keyword>(?:e?s)?\b` for a keyword.
 *
 * The word boundaries stop `"egg"` firing on `"eggplant"` and `"oat"` firing on
 * `"goat"`. The optional `e?s` tolerates simple English plurals, so `"prawn"`
 * matches `"prawns"` and `"tomato"` matches `"tomatoes"`.
 */
function patternFor(keyword: string): RegExp {
  let pattern = PATTERN_CACHE.get(keyword);
  if (!pattern) {
    pattern = new RegExp(`\\b${escapeRegExp(keyword)}(?:e?s)?\\b`, "i");
    PATTERN_CACHE.set(keyword, pattern);
  }
  return pattern;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Returns true when `text` mentions `keyword` as a whole word.
 *
 * `text` is normalised here, so callers may pass raw menu text.
 */
export function containsKeyword(text: string, keyword: string): boolean {
  const haystack = normalizeText(text);
  if (haystack === "") return false;
  return patternFor(keyword).test(haystack);
}

/**
 * Returns the first keyword from `keywords` that `text` mentions, or `null`.
 *
 * Keywords are tested longest-first so the most specific term is the one
 * reported — the caller shows this string to the user as the reason for a
 * decision, and `"soy sauce"` explains more than `"soy"`.
 */
export function findKeyword(
  text: string,
  keywords: readonly string[]
): string | null {
  const haystack = normalizeText(text);
  if (haystack === "") return null;

  const ordered = [...keywords].sort(
    (a, b) => b.length - a.length || a.localeCompare(b)
  );

  for (const keyword of ordered) {
    if (patternFor(keyword).test(haystack)) return keyword;
  }
  return null;
}

/**
 * Returns the first keyword mentioned across any entry of `texts`, or `null`.
 *
 * Each entry is matched separately so that adjacent list items can never be
 * read as a single phrase — `["pine", "nut oil"]` must not match `"pine nut"`.
 */
export function findKeywordInAny(
  texts: readonly string[],
  keywords: readonly string[]
): string | null {
  for (const text of texts) {
    const hit = findKeyword(text, keywords);
    if (hit !== null) return hit;
  }
  return null;
}
