// allergen-table.ts — deterministic ingredient → allergen lookup.
//
// This is the audited core of Orderly. It is a plain data table plus a
// matcher, deliberately containing no model calls, no network, and no
// randomness, so that its behaviour can be read off the source and pinned by
// tests. Everything that decides whether a person can safely eat something
// passes through here.
//
// Scope: the 14 major allergens of EU Regulation 1169/2011, Annex II.
//
// Keys include common non-English terms, because the vision model returns
// ingredient hints in the menu's own language as often as in the diner's.

import type { AllergenId } from "./types";
import { containsKeyword } from "./keyword-match";

// ---------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------

/**
 * Ingredient keyword → allergen group.
 *
 * Keys are lowercase. Multi-word keys are matched as phrases. Longer keys win
 * over shorter ones (see `matchAllergens`), so `"soy sauce"` is reported in
 * preference to `"soy"` — a better explanation for the same conclusion.
 *
 * Adding a key can only ever make the matcher *more* cautious, so err toward
 * inclusion. Removing a key is a safety change and needs a test.
 */
export const ALLERGEN_TABLE: Readonly<Record<string, AllergenId>> = {
  // ── 1. Cereals containing gluten ──
  wheat: "cereals-gluten",
  "wheat flour": "cereals-gluten",
  flour: "cereals-gluten",
  rye: "cereals-gluten",
  barley: "cereals-gluten",
  oat: "cereals-gluten",
  spelt: "cereals-gluten",
  kamut: "cereals-gluten",
  semolina: "cereals-gluten",
  couscous: "cereals-gluten",
  bread: "cereals-gluten",
  breadcrumb: "cereals-gluten",
  breaded: "cereals-gluten",
  batter: "cereals-gluten",
  pastry: "cereals-gluten",
  pasta: "cereals-gluten",
  noodle: "cereals-gluten",
  udon: "cereals-gluten",
  ramen: "cereals-gluten",
  panko: "cereals-gluten",
  seitan: "cereals-gluten",
  tempura: "cereals-gluten",
  farine: "cereals-gluten",
  trigo: "cereals-gluten",
  weizen: "cereals-gluten",
  harina: "cereals-gluten",

  // ── 2. Crustaceans ──
  shrimp: "crustaceans",
  prawn: "crustaceans",
  crab: "crustaceans",
  lobster: "crustaceans",
  crayfish: "crustaceans",
  langoustine: "crustaceans",
  shellfish: "crustaceans",
  ebi: "crustaceans",
  gamba: "crustaceans",
  crevette: "crustaceans",
  camarao: "crustaceans",

  // ── 3. Eggs ──
  egg: "eggs",
  "egg yolk": "eggs",
  "egg white": "eggs",
  mayonnaise: "eggs",
  mayo: "eggs",
  aioli: "eggs",
  meringue: "eggs",
  albumen: "eggs",
  custard: "eggs",
  tamago: "eggs",
  oeuf: "eggs",
  huevo: "eggs",
  ovo: "eggs",

  // ── 4. Fish ──
  fish: "fish",
  "fish sauce": "fish",
  anchovy: "fish",
  tuna: "fish",
  salmon: "fish",
  cod: "fish",
  bacalhau: "fish",
  sardine: "fish",
  mackerel: "fish",
  bonito: "fish",
  dashi: "fish",
  katsuobushi: "fish",
  "worcestershire sauce": "fish",
  poisson: "fish",
  pescado: "fish",

  // ── 5. Peanuts ──
  peanut: "peanuts",
  "peanut oil": "peanuts",
  "peanut butter": "peanuts",
  groundnut: "peanuts",
  satay: "peanuts",
  cacahuete: "peanuts",
  amendoim: "peanuts",

  // ── 6. Soybeans ──
  soy: "soybeans",
  soya: "soybeans",
  "soy sauce": "soybeans",
  soybean: "soybeans",
  tofu: "soybeans",
  edamame: "soybeans",
  miso: "soybeans",
  tempeh: "soybeans",
  shoyu: "soybeans",
  tamari: "soybeans",
  "hoisin sauce": "soybeans",
  hoisin: "soybeans",
  ponzu: "soybeans",

  // ── 7. Milk ──
  milk: "milk",
  milkshake: "milk",
  butter: "milk",
  buttermilk: "milk",
  cheese: "milk",
  cream: "milk",
  yoghurt: "milk",
  yogurt: "milk",
  ghee: "milk",
  paneer: "milk",
  mozzarella: "milk",
  parmesan: "milk",
  ricotta: "milk",
  mascarpone: "milk",
  lactose: "milk",
  leche: "milk",
  fromage: "milk",
  queijo: "milk",
  nata: "milk",

  // ── 8. Tree nuts ──
  almond: "tree-nuts",
  hazelnut: "tree-nuts",
  walnut: "tree-nuts",
  cashew: "tree-nuts",
  pecan: "tree-nuts",
  pistachio: "tree-nuts",
  macadamia: "tree-nuts",
  "brazil nut": "tree-nuts",
  "pine nut": "tree-nuts",
  praline: "tree-nuts",
  marzipan: "tree-nuts",
  nutella: "tree-nuts",
  amendoa: "tree-nuts",
  amande: "tree-nuts",

  // ── 9. Celery ──
  celery: "celery",
  celeriac: "celery",
  "celery salt": "celery",
  aipo: "celery",

  // ── 10. Mustard ──
  mustard: "mustard",
  dijon: "mustard",
  moutarde: "mustard",
  mostarda: "mustard",

  // ── 11. Sesame ──
  sesame: "sesame",
  "sesame oil": "sesame",
  "sesame seed": "sesame",
  tahini: "sesame",
  halva: "sesame",
  zaatar: "sesame",
  goma: "sesame",
  gergelim: "sesame",

  // ── 12. Sulphur dioxide / sulphites ──
  sulphite: "sulphites",
  sulfite: "sulphites",
  "dried fruit": "sulphites",
  wine: "sulphites",
  vinho: "sulphites",

  // ── 13. Lupin ──
  lupin: "lupin",
  lupine: "lupin",
  tremoco: "lupin",

  // ── 14. Molluscs ──
  squid: "molluscs",
  calamari: "molluscs",
  octopus: "molluscs",
  mussel: "molluscs",
  clam: "molluscs",
  ameijoa: "molluscs",
  oyster: "molluscs",
  scallop: "molluscs",
  snail: "molluscs",
  escargot: "molluscs",
  cuttlefish: "molluscs",
  ika: "molluscs",
  tako: "molluscs",
  lula: "molluscs",
  polvo: "molluscs",
};

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/** A single ingredient→allergen match, without provenance. */
export interface AllergenMatch {
  allergen: AllergenId;
  /** The table key that matched, for explaining the decision to the user. */
  matchedIngredient: string;
}

/**
 * Table keys ordered longest-first.
 *
 * Precomputed once. The ordering is what makes `"soy sauce"` beat `"soy"`:
 * both conclude `soybeans`, but the longer key is the more informative
 * explanation, and the first match for an allergen is the one we keep.
 */
const KEYS_LONGEST_FIRST: readonly string[] = Object.keys(ALLERGEN_TABLE).sort(
  (a, b) => b.length - a.length || a.localeCompare(b)
);

/**
 * Finds every allergen referenced by a single piece of text.
 *
 * At most one match is returned per allergen — the longest matching key wins,
 * because it is the most specific explanation for the same conclusion.
 *
 * Iteration follows `KEYS_LONGEST_FIRST`, which is a stable precomputed order,
 * so the output is deterministic for a given input.
 */
export function matchAllergens(text: string): AllergenMatch[] {
  if (text.trim() === "") return [];

  const seen = new Map<AllergenId, string>();

  for (const key of KEYS_LONGEST_FIRST) {
    const allergen = ALLERGEN_TABLE[key];
    // A longer key for this allergen already matched — keep the better explanation.
    if (seen.has(allergen)) continue;
    if (containsKeyword(text, key)) {
      seen.set(allergen, key);
    }
  }

  return [...seen.entries()].map(([allergen, matchedIngredient]) => ({
    allergen,
    matchedIngredient,
  }));
}

/**
 * Maps a list of ingredient strings to the allergens they imply.
 *
 * Deduplicated across the whole list: if both `"wheat"` and `"bread"` appear,
 * `cereals-gluten` is reported once, attributed to the longest key that matched
 * anywhere in the list.
 *
 * An unrecognised ingredient contributes nothing. The matcher never guesses —
 * an empty result means "no allergen was detected", which is emphatically not
 * the same claim as "this dish is allergen-free".
 */
export function mapIngredientsToAllergens(
  ingredients: readonly string[]
): AllergenMatch[] {
  const best = new Map<AllergenId, string>();

  // Matched per ingredient rather than over a joined string, so that adjacent
  // entries can never combine into a phrase the menu never contained —
  // ["pine", "nut oil"] must not be read as "pine nut".
  for (const ingredient of ingredients) {
    for (const match of matchAllergens(ingredient)) {
      const existing = best.get(match.allergen);
      if (existing === undefined || match.matchedIngredient.length > existing.length) {
        best.set(match.allergen, match.matchedIngredient);
      }
    }
  }

  return [...best.entries()].map(([allergen, matchedIngredient]) => ({
    allergen,
    matchedIngredient,
  }));
}
