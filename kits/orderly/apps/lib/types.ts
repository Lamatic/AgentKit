// types.ts — shared domain types for Orderly.
//
// The design split this file encodes:
//   * `RawDish` is what the language model produced. Treat every field as a claim.
//   * `EnrichedDish` is what deterministic code concluded. Treat it as a fact.
//
// Nothing downstream of `enrichDishes()` should read `likelyIngredients` to make
// a safety decision — that is what `allergens` and `diet` are for.

// ---------------------------------------------------------------------------
// Allergens & diets
// ---------------------------------------------------------------------------

/**
 * The 14 major allergens defined by EU Food Information for Consumers
 * Regulation No. 1169/2011, Annex II, in regulation order.
 *
 * This is the single source of truth: `AllergenId` is derived from it, and the
 * request validator builds its enum from it. Adding an entry here updates the
 * type, the schema, and the UI list together — they cannot drift apart.
 *
 * The list is fixed by regulation. It is not a preference list and must not be
 * extended casually.
 */
export const ALL_ALLERGENS = [
  "cereals-gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soybeans",
  "milk",
  "tree-nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;

export type AllergenId = (typeof ALL_ALLERGENS)[number];

/** Human-readable allergen labels for the UI and for rejection reasons. */
export const ALLERGEN_LABELS: Record<AllergenId, string> = {
  "cereals-gluten": "cereals containing gluten",
  crustaceans: "crustaceans",
  eggs: "eggs",
  fish: "fish",
  peanuts: "peanuts",
  soybeans: "soybeans",
  milk: "milk",
  "tree-nuts": "tree nuts",
  celery: "celery",
  mustard: "mustard",
  sesame: "sesame",
  sulphites: "sulphur dioxide / sulphites",
  lupin: "lupin",
  molluscs: "molluscs",
};

export type DietId = "vegetarian" | "vegan" | "halal" | "gluten-free";

/**
 * Three-valued logic, used everywhere a photograph cannot establish a fact.
 *
 * `true` / `false` are conclusions. `"unknown"` is the honest answer when the
 * menu simply does not say — for example, halal status depends on slaughter
 * method, which no image can reveal. Collapsing `"unknown"` into `false` would
 * be over-restrictive; collapsing it into `true` would be unsafe.
 */
export type Tristate = boolean | "unknown";

// ---------------------------------------------------------------------------
// Dishes — model output
// ---------------------------------------------------------------------------

/**
 * How sure the vision model was that it read this menu line correctly.
 * `"unknown"` items are surfaced to the user and excluded from the solver.
 */
export type ReadConfidence = "high" | "medium" | "unknown";

/** One dish exactly as the `menu-scan` flow returned it. Model output — unverified. */
export interface RawDish {
  /** The dish name as printed, in the menu's own script. */
  nameOriginal: string;
  /** Romanised form, when the original is not in Latin script. */
  nameTransliterated?: string;
  /** Translated into the diner's target language. */
  nameTranslated?: string;
  /** One-line plain description of the dish. */
  description?: string;
  /**
   * The model's *inference* about what is in the dish, from its name and
   * description. Not printed fact. Drives "may contain", never "contains".
   */
  likelyIngredients?: string[];
  /** The price string exactly as printed, e.g. "¥980", "1.200,50 €". */
  priceRaw?: string;
  /** starter | main | side | dessert | drink — used for variety, best-effort. */
  category?: string;
  /** The model's confidence that it read this line correctly. */
  confidence?: ReadConfidence;
}

// ---------------------------------------------------------------------------
// Dishes — after the deterministic pass
// ---------------------------------------------------------------------------

/**
 * Whether an allergen is *stated* or *inferred*.
 *
 * `"contains"` is only ever assigned when the allergen keyword appears in text
 * the restaurant itself wrote — the dish name or its description. Anything
 * derived from the model's guessed ingredient list is `"may-contain"`.
 *
 * The UI must render these differently. The solver treats both as disqualifying,
 * because a maybe-allergen is not a risk anyone should be asked to take.
 */
export type AllergenCertainty = "contains" | "may-contain";

export interface AllergenHit {
  allergen: AllergenId;
  /** The ingredient keyword that triggered the match, for explainability. */
  matchedIngredient: string;
  certainty: AllergenCertainty;
}

export interface DietVerdict {
  vegetarian: Tristate;
  vegan: Tristate;
  halal: Tristate;
  glutenFree: Tristate;
  /** Human-readable justifications, e.g. "contains pork". Never empty when a value is false. */
  reasons: string[];
}

export interface ParsedPrice {
  /** Numeric value in major units, e.g. 12.5 for "$12.50". */
  amount: number;
  /** ISO 4217 code where determinable, e.g. "EUR". Empty string when unknown. */
  currency: string;
}

/** A dish after deterministic enrichment. Safe to make decisions from. */
export interface EnrichedDish extends RawDish {
  /** Stable identifier derived from position + name. Used by the solver and UI. */
  id: string;
  /** Allergens detected, with provenance. Empty means none *detected* — not "none present". */
  allergens: AllergenHit[];
  diet: DietVerdict;
  /** `null` when the price could not be parsed. Never coerce this to 0. */
  price: ParsedPrice | null;
  /** True when the vision model could not read the line with confidence. */
  unreadable: boolean;
}

// ---------------------------------------------------------------------------
// Diners & constraints
// ---------------------------------------------------------------------------

export interface Diner {
  id: string;
  /** Display name, e.g. "Priya". Appears in rejection reasons. */
  label: string;
  /** Allergens this diner must avoid. Hard constraint — never traded off. */
  avoidAllergens: AllergenId[];
  /** Dietary requirement, or null for no restriction. */
  diet: DietId | null;
  /** Free-text ingredient keywords to avoid by preference. Soft constraint. */
  dislikes: string[];
}

export interface Budget {
  amount: number;
  currency: string;
}

/**
 * How the table eats.
 *
 * `"shared"` — plates go to the middle; a dish counts once toward the bill and
 *   can feed several diners. This is the default because it matches how people
 *   actually order in the cuisines this tool is most useful for.
 * `"individual"` — each diner needs their own dish; a dish serves one person.
 */
export type ServingModel = "shared" | "individual";

// ---------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------

/**
 * Per-dish, per-diner outcome.
 *
 * `"avoid"` is absolute: the solver removes these dishes from its candidate
 * pool before it begins, so no budget or variety pressure can reintroduce them.
 * `"caution"` is advisory — shown to the user, still selectable.
 */
export type Verdict = "safe" | "caution" | "avoid";

export interface DishVerdict {
  verdict: Verdict;
  /** Why. Always non-empty for "avoid" and "caution". */
  reasons: string[];
}
