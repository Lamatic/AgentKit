// diet-rules.ts — deterministic dietary classification.
//
// Four questions, answered from an ingredient list: is it vegetarian, vegan,
// halal, gluten-free?
//
// The governing principle here is that `"unknown"` is a real answer and often
// the only honest one. A photograph of a menu cannot establish how an animal
// was slaughtered, so `halal` is `"unknown"` for any meat dish rather than
// `false` (which would wrongly condemn a dish from a halal kitchen) or `true`
// (which would be unsafe). Callers must handle three states; the solver treats
// `"unknown"` for a diner's stated diet as `caution`, not as permission.

import type { DietId, DietVerdict, Tristate } from "./types";
import { findKeywordInAny } from "./keyword-match";
import { mapIngredientsToAllergens } from "./allergen-table";

// ---------------------------------------------------------------------------
// Keyword sets
// ---------------------------------------------------------------------------

/**
 * Land-animal flesh and animal-derived thickeners. Disqualifies vegetarian.
 *
 * Breadth matters more here than anywhere else in this file. A gap does not
 * produce a vague answer — it produces a confident `vegetarian: true` on a meat
 * dish, which is the single worst output this module can generate. Game birds
 * and offal are the usual blind spots, so they are enumerated explicitly rather
 * than left to a generic "meat" catch-all that menus rarely print.
 */
const MEAT = [
  // Generic
  "meat", "flesh",
  // Common livestock
  "pork", "beef", "veal", "lamb", "mutton", "goat", "hogget",
  // Poultry and game birds
  "chicken", "poultry", "duck", "turkey", "goose", "quail", "pheasant",
  "partridge", "squab", "pigeon", "guinea fowl", "ostrich", "emu",
  // Game and other
  "rabbit", "hare", "venison", "boar", "bison", "buffalo", "elk", "reindeer",
  "kangaroo", "horse",
  // Cured and prepared
  "bacon", "ham", "gammon", "prosciutto", "salami", "chorizo", "sausage",
  "pepperoni", "pancetta", "speck", "bresaola", "mortadella", "guanciale",
  "jerky", "meatball", "confit", "rillette", "terrine",
  // Offal
  "liver", "tripe", "kidney", "sweetbread", "offal", "foie gras", "pate",
  "marrow", "trotter", "gizzard",
  // Cuts and derivatives
  "oxtail", "brisket", "steak", "sirloin", "tenderloin", "cutlet", "mince",
  "lard", "tallow", "suet", "gelatin", "gelatine", "collagen",
  // Non-English terms that appear on menus
  "carne", "cerdo", "pollo", "pato", "ganso", "cordero", "ternera", "pavo",
  "frango", "porco", "vaca", "vitela", "boeuf", "veau", "poulet", "canard",
  "agneau", "dinde", "jambon", "oie", "buta", "tori", "gyu", "niku",
] as const;

/** Sea-animal flesh and its derivatives. Disqualifies vegetarian. */
const SEAFOOD = [
  "fish", "fish sauce", "anchovy", "tuna", "salmon", "cod", "bacalhau",
  "sardine", "mackerel", "bonito", "dashi", "katsuobushi", "seafood",
  "shrimp", "prawn", "crab", "lobster", "crayfish", "shellfish",
  "squid", "calamari", "octopus", "mussel", "clam", "oyster", "scallop",
  "snail", "escargot", "cuttlefish", "caviar", "roe",
  "pescado", "poisson", "marisco", "sakana",
] as const;

/** Dairy. Vegetarian-compatible, disqualifies vegan. */
const DAIRY = [
  "milk", "milkshake", "buttermilk", "butter", "cheese", "cream", "yoghurt",
  "yogurt", "ghee", "paneer", "mozzarella", "parmesan", "ricotta",
  "mascarpone", "lactose", "whey", "casein", "custard",
  "leche", "queijo", "fromage", "nata",
] as const;

/** Eggs. Vegetarian-compatible, disqualifies vegan. */
const EGG = [
  "egg", "egg yolk", "egg white", "mayonnaise", "mayo", "aioli", "meringue",
  "albumen", "tamago", "oeuf", "huevo", "ovo",
] as const;

/** Other animal products that disqualify vegan but not vegetarian. */
const OTHER_ANIMAL = ["honey", "beeswax", "royal jelly", "mel", "miel"] as const;

/** Pork and its derivatives. Disqualifies halal outright. */
const PORK = [
  "pork", "bacon", "ham", "lard", "prosciutto", "pancetta", "pepperoni",
  "gammon", "chorizo", "cerdo", "porco", "buta",
] as const;

/**
 * Ingredients whose halal status depends on their source rather than their
 * presence.
 *
 * Rennet is the case that matters: it may be microbial or animal-derived, and
 * if animal-derived the answer turns on how that animal was slaughtered. A
 * menu cannot say which.
 *
 * Only an explicit mention counts. Inferring rennet from the mere presence of
 * cheese would mark most Western dishes uncertain and drown the signal in
 * noise, so this fires when a menu actually names it.
 */
const HALAL_UNCERTAIN = ["rennet", "animal rennet", "cuajo", "presura"] as const;

/** Alcohol, including cooking wines. Disqualifies halal outright. */
const ALCOHOL = [
  "wine", "beer", "sake", "mirin", "rum", "brandy", "whisky", "whiskey",
  "vodka", "liqueur", "cognac", "sherry", "vermouth", "alcohol", "ale",
  "cider", "champagne", "prosecco", "vinho", "cerveja",
] as const;

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/**
 * Classifies a dish's dietary compatibility from its ingredient list.
 *
 * Every `false` verdict carries a human-readable reason naming the ingredient
 * responsible, because the UI shows the reason and a bare "not vegetarian" is
 * not something a diner can act on or dispute.
 *
 * With no ingredients at all there is no evidence, so every field is
 * `"unknown"`. This is the correct output for a menu line the vision model
 * could not interpret, and it is distinct from "we checked and found nothing".
 *
 * @param ingredients - Ingredient hints. These are the model's inference, not
 *   printed fact; see `allergen-engine.ts` for how that provenance is tracked.
 */
export function dietVerdict(
  ingredients: readonly string[],
  nameHints: readonly string[] = []
): DietVerdict {
  const usable = ingredients.filter((entry) => entry.trim() !== "");
  const reasons: string[] = [];

  /**
   * The dish name is searched for disqualifying terms but does **not** count as
   * evidence that a dish is acceptable.
   *
   * The asymmetry is deliberate. "Pork Belly" with an empty ingredient list is
   * conclusively not vegetarian — the restaurant said so in the title. But
   * "Chef's Special" with an empty ingredient list tells us nothing, and
   * reading the absence of the word "pork" as proof of vegetarianism would
   * manufacture a permission we have no basis for. So a name can only ever
   * push a verdict to `false`, never to `true`.
   */
  const searchable = [...usable, ...nameHints.filter((n) => n.trim() !== "")];
  const hasEvidence = usable.length > 0;

  const meatHit = findKeywordInAny(searchable, MEAT);
  const seafoodHit = findKeywordInAny(searchable, SEAFOOD);
  const dairyHit = findKeywordInAny(searchable, DAIRY);
  const eggHit = findKeywordInAny(searchable, EGG);
  const otherAnimalHit = findKeywordInAny(searchable, OTHER_ANIMAL);
  const porkHit = findKeywordInAny(searchable, PORK);
  const alcoholHit = findKeywordInAny(searchable, ALCOHOL);
  const rennetHit = findKeywordInAny(searchable, HALAL_UNCERTAIN);

  const glutenHit = mapIngredientsToAllergens(searchable).find(
    (match) => match.allergen === "cereals-gluten"
  );

  const nothingDisqualifying =
    meatHit === null &&
    seafoodHit === null &&
    dairyHit === null &&
    eggHit === null &&
    otherAnimalHit === null &&
    porkHit === null &&
    alcoholHit === null &&
    rennetHit === null &&
    glutenHit === undefined;

  // No ingredients and nothing incriminating in the name — decline to conclude.
  if (!hasEvidence && nothingDisqualifying) {
    return {
      vegetarian: "unknown",
      vegan: "unknown",
      halal: "unknown",
      glutenFree: "unknown",
      reasons: ["no ingredient information available"],
    };
  }

  /** `true` only when we actually have ingredients; otherwise `"unknown"`. */
  const cleared: Tristate = hasEvidence ? true : "unknown";

  // ── Vegetarian ──
  let vegetarian: Tristate = cleared;
  if (meatHit !== null) {
    vegetarian = false;
    reasons.push(`contains ${meatHit}`);
  }
  if (seafoodHit !== null) {
    vegetarian = false;
    reasons.push(`contains ${seafoodHit}`);
  }

  // ── Vegan — everything vegetarian excludes, plus dairy, egg and honey ──
  let vegan: Tristate = vegetarian === false ? false : cleared;
  if (dairyHit !== null) {
    vegan = false;
    reasons.push(`contains ${dairyHit} (not vegan)`);
  }
  if (eggHit !== null) {
    vegan = false;
    reasons.push(`contains ${eggHit} (not vegan)`);
  }
  if (otherAnimalHit !== null) {
    vegan = false;
    reasons.push(`contains ${otherAnimalHit} (not vegan)`);
  }

  // ── Halal ──
  // Pork and alcohol are disqualifying and visible on a menu, so they yield a
  // firm `false`. Any other meat is `"unknown"`: whether it is halal depends on
  // the slaughter method, which no photograph can show. A dish with no meat and
  // no alcohol is treated as permissible.
  let halal: Tristate;
  if (porkHit !== null) {
    halal = false;
    reasons.push(`contains ${porkHit} (not halal)`);
  } else if (alcoholHit !== null) {
    halal = false;
    reasons.push(`contains ${alcoholHit} (not halal)`);
  } else if (meatHit !== null || seafoodHit !== null) {
    halal = "unknown";
    reasons.push("halal status depends on preparation — confirm with staff");
  } else if (rennetHit !== null) {
    // Rennet may be microbial or animal-derived, and if animal-derived the
    // answer turns on slaughter method. Neither is visible on a menu.
    halal = "unknown";
    reasons.push(
      `contains ${rennetHit}, which may be animal-derived — confirm with staff`
    );
  } else {
    halal = cleared;
  }

  // ── Gluten-free ──
  let glutenFree: Tristate = cleared;
  if (glutenHit !== undefined) {
    glutenFree = false;
    reasons.push(`contains ${glutenHit.matchedIngredient} (gluten)`);
  }

  return { vegetarian, vegan, halal, glutenFree, reasons };
}

/**
 * Reads a single diet's verdict off a `DietVerdict`.
 *
 * Exists so callers do not re-map diet IDs to field names at each call site;
 * the solver and the UI both need this and must agree.
 */
export function verdictForDiet(verdict: DietVerdict, diet: DietId): Tristate {
  switch (diet) {
    case "vegetarian":
      return verdict.vegetarian;
    case "vegan":
      return verdict.vegan;
    case "halal":
      return verdict.halal;
    case "gluten-free":
      return verdict.glutenFree;
    default: {
      // Exhaustiveness guard: adding a member to DietId without mapping it here
      // is a compile error rather than a diet that silently never applies.
      const unhandled: never = diet;
      throw new Error(`Unhandled diet: ${String(unhandled)}`);
    }
  }
}
