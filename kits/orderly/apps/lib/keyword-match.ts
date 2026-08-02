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
 * Compiled patterns, cached across calls.
 *
 * Most keywords come from module-level constant tables and are compiled once.
 * A few do not: a diner's `dislikes` are free text, so the cache is bounded to
 * stop an adversarial or merely long-lived process from growing it without
 * limit. Eviction is oldest-first, which keeps the constant tables resident
 * because they are compiled during the first request and re-requested
 * constantly thereafter.
 */
const PATTERN_CACHE = new Map<string, RegExp>();
const MAX_CACHED_PATTERNS = 2_000;

/**
 * Qualifiers that negate an immediately preceding keyword.
 *
 * "egg-free", "dairy free", "nut free" are claims that the allergen is absent,
 * so matching the keyword inside them would invert the menu's meaning and flag
 * a dish precisely because it advertised being safe.
 *
 * Kept deliberately short and literal. This handles the suffix form only —
 * "gluten-free bread" still matches on `bread`, because the qualifier does not
 * sit next to the matched key. That is the conservative direction to fail in.
 */
const FREE_FROM_QUALIFIERS = ["free"] as const;

const NEGATION_LOOKAHEAD = `(?!\\s+(?:${FREE_FROM_QUALIFIERS.join("|")})\\b)`;

/**
 * Builds `\b<keyword>(?:e?s)?\b` for a keyword, with a free-from guard.
 *
 * The word boundaries stop `"egg"` firing on `"eggplant"` and `"oat"` firing on
 * `"goat"`. The optional `e?s` tolerates simple English plurals, so `"prawn"`
 * matches `"prawns"` and `"tomato"` matches `"tomatoes"`.
 *
 * The keyword is normalised the same way haystacks are, so a caller-supplied
 * term like `"Soy-Sauce"` compiles to a pattern that can actually match the
 * normalised text `"soy sauce"`.
 */
function patternFor(keyword: string): RegExp {
  const normalized = normalizeText(keyword);

  let pattern = PATTERN_CACHE.get(normalized);
  if (!pattern) {
    pattern = new RegExp(
      `\\b${escapeRegExp(normalized)}(?:e?s)?\\b${NEGATION_LOOKAHEAD}`,
      "i"
    );

    if (PATTERN_CACHE.size >= MAX_CACHED_PATTERNS) {
      const oldest = PATTERN_CACHE.keys().next().value;
      if (oldest !== undefined) PATTERN_CACHE.delete(oldest);
    }
    PATTERN_CACHE.set(normalized, pattern);
  }
  return pattern;
}

/**
 * Keyword lists in their matching order, cached by array identity.
 *
 * The tables are module-level constants, so the same arrays are sorted over and
 * over. A `WeakMap` keyed on the array means each list is ordered once and the
 * entry disappears with the array itself.
 */
const ORDER_CACHE = new WeakMap<readonly string[], readonly string[]>();

function orderedKeywords(keywords: readonly string[]): readonly string[] {
  let ordered = ORDER_CACHE.get(keywords);
  if (ordered === undefined) {
    ordered = [...keywords].sort(
      (a, b) => b.length - a.length || a.localeCompare(b)
    );
    ORDER_CACHE.set(keywords, ordered);
  }
  return ordered;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Returns true when already-normalised `haystack` mentions `keyword`.
 *
 * Exported for callers that test many keywords against one piece of text and
 * would otherwise re-normalise it once per keyword. Callers are responsible for
 * having run `normalizeText` first.
 */
export function normalizedTextHasKeyword(
  haystack: string,
  keyword: string
): boolean {
  if (haystack === "") return false;
  return patternFor(keyword).test(haystack);
}

/**
 * Returns true when `text` mentions `keyword` as a whole word.
 *
 * `text` is normalised here, so callers may pass raw menu text.
 */
export function containsKeyword(text: string, keyword: string): boolean {
  return normalizedTextHasKeyword(normalizeText(text), keyword);
}

/**
 * Returns the first keyword from `keywords` that `text` mentions, or `null`.
 *
 * Keywords are tested longest-first so the most specific term is the one
 * reported. The caller shows this string to the user as the reason for a
 * decision, and `"soy sauce"` explains more than `"soy"`.
 */
export function findKeyword(
  text: string,
  keywords: readonly string[]
): string | null {
  const haystack = normalizeText(text);
  if (haystack === "") return null;

  for (const keyword of orderedKeywords(keywords)) {
    if (normalizedTextHasKeyword(haystack, keyword)) return keyword;
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
