// allergen-engine.ts — turns model output into per-diner safety verdicts.
//
// This is the boundary between what a language model claimed and what this app
// is willing to assert. Above it, `RawDish` is a set of claims. Below it,
// `EnrichedDish` carries conclusions that the solver and the UI are allowed to
// act on.
//
// Two ideas do most of the work here.
//
// **Provenance.** An allergen is reported as `"contains"` only when its keyword
// appears in the dish *name* — a transcription of what the restaurant itself
// printed. Anything derived from the model's inferred ingredient list, or from
// its own prose description, is `"may-contain"`. The distinction is shown in
// the UI and is the difference between reporting a menu and inventing one.
//
// **Both certainties disqualify.** For the purposes of a diner who has told us
// to avoid an allergen, `"may-contain"` is as disqualifying as `"contains"`.
// A maybe-allergen is not a risk anyone should be asked to take on the strength
// of an OCR pass. The certainty distinction informs the human; it never relaxes
// the constraint.

import type {
  AllergenHit,
  Diner,
  DishVerdict,
  EnrichedDish,
  RawDish,
} from "./types";
import { ALLERGEN_LABELS } from "./types";
import { matchAllergens, mapIngredientsToAllergens } from "./allergen-table";
import { dietVerdict, verdictForDiet } from "./diet-rules";
import { findKeywordInAny } from "./keyword-match";
import { parsePrice } from "./price";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/**
 * Builds a stable, URL-safe identifier for a dish.
 *
 * Position is included because menus repeat names ("House Salad" twice, in two
 * sections) and the solver and UI must be able to tell them apart. Stability
 * matters: the same scan must produce the same IDs, or React keys and the
 * solver's tie-breaking both become non-deterministic.
 */
export function dishId(nameOriginal: string, index: number): string {
  const slug = nameOriginal
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug === "" ? `dish-${index}` : `${index}-${slug}`;
}

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------

/** The name fields, which transcribe what the restaurant printed. */
function nameText(raw: RawDish): string[] {
  return [raw.nameOriginal, raw.nameTransliterated, raw.nameTranslated].filter(
    (value): value is string => typeof value === "string" && value.trim() !== ""
  );
}

/**
 * Determines the allergens for a dish, with provenance.
 *
 * Name matches outrank ingredient matches: if "Ebi Tempura" is on the menu, the
 * restaurant has told us there is shrimp in it, and that is a `"contains"`. If
 * the model merely guessed that a stew probably has celery in it, that is a
 * `"may-contain"`.
 */
export function detectAllergens(raw: RawDish): AllergenHit[] {
  const hits = new Map<string, AllergenHit>();

  // Pass 1 — the dish name. Restaurant-authored, so these are firm.
  for (const name of nameText(raw)) {
    for (const match of matchAllergens(name)) {
      if (!hits.has(match.allergen)) {
        hits.set(match.allergen, { ...match, certainty: "contains" });
      }
    }
  }

  // Pass 2 — the model's inferred ingredients and its own description.
  // These never upgrade an existing "contains", and never claim more than "may".
  const inferred = [...(raw.likelyIngredients ?? [])];
  if (raw.description !== undefined && raw.description.trim() !== "") {
    inferred.push(raw.description);
  }

  for (const match of mapIngredientsToAllergens(inferred)) {
    if (!hits.has(match.allergen)) {
      hits.set(match.allergen, { ...match, certainty: "may-contain" });
    }
  }

  return [...hits.values()];
}

/**
 * Enriches one raw dish into a dish the rest of the app can reason about.
 *
 * A dish is `unreadable` when the vision model flagged low confidence or when
 * it produced no usable name. Unreadable dishes are surfaced to the user and
 * excluded from the solver — they are never quietly dropped, and never guessed
 * at.
 */
export function enrichDish(
  raw: RawDish,
  index: number,
  currencyHint?: string
): EnrichedDish {
  const unreadable =
    raw.confidence === "unknown" ||
    typeof raw.nameOriginal !== "string" ||
    raw.nameOriginal.trim() === "";

  return {
    ...raw,
    id: dishId(raw.nameOriginal ?? "", index),
    allergens: detectAllergens(raw),
    // The name is passed as a disqualifying-only signal: "Pork Belly" is not
    // vegetarian even when the model returned no ingredients, but a name with
    // nothing incriminating in it never earns a dish a clean verdict.
    diet: dietVerdict(raw.likelyIngredients ?? [], nameText(raw)),
    price: parsePrice(raw.priceRaw, currencyHint),
    unreadable,
  };
}

/**
 * Enriches a whole menu.
 *
 * @param currencyHint - The menu-level currency reported by the flow, used for
 *   price strings that carry no symbol of their own.
 */
export function enrichDishes(
  raws: readonly RawDish[],
  currencyHint?: string
): EnrichedDish[] {
  return raws.map((raw, index) => enrichDish(raw, index, currencyHint));
}

// ---------------------------------------------------------------------------
// Per-diner verdicts
// ---------------------------------------------------------------------------

/** Human-readable diet names for reason strings. */
const DIET_LABELS: Record<string, string> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  halal: "halal",
  "gluten-free": "gluten-free",
};

/**
 * Decides whether one diner can eat one dish.
 *
 * Evaluated in strict priority order:
 *
 *  1. **Unreadable** → `avoid`. We could not read the line, so we will not
 *     vouch for it.
 *  2. **Allergen conflict** → `avoid`. Absolute. This is the constraint the
 *     whole app exists to enforce, and nothing downstream may relax it.
 *  3. **Diet conflict** (a firm `false`) → `avoid`.
 *  4. **Diet unknown** → `caution`. We genuinely do not know; the diner
 *     decides.
 *  5. **Disliked ingredient** → `caution`. A preference, not a safety matter.
 *  6. Otherwise → `safe`.
 *
 * Every non-`safe` verdict carries at least one reason, because the UI shows it
 * and a verdict a diner cannot interrogate is not worth giving.
 */
export function dishVerdictForDiner(
  dish: EnrichedDish,
  diner: Diner
): DishVerdict {
  const reasons: string[] = [];

  // ── 1. Unreadable ──
  if (dish.unreadable) {
    return {
      verdict: "avoid",
      reasons: ["this menu line could not be read reliably"],
    };
  }

  // ── 2. Allergen conflict — absolute ──
  const conflicts = dish.allergens.filter((hit) =>
    diner.avoidAllergens.includes(hit.allergen)
  );

  if (conflicts.length > 0) {
    for (const hit of conflicts) {
      const label = ALLERGEN_LABELS[hit.allergen];
      const qualifier = hit.certainty === "contains" ? "contains" : "may contain";
      reasons.push(
        `${qualifier} ${label} (${hit.matchedIngredient}) — ${diner.label} avoids this`
      );
    }
    return { verdict: "avoid", reasons };
  }

  // ── 3 & 4. Diet ──
  if (diner.diet !== null) {
    const compatible = verdictForDiet(dish.diet, diner.diet);
    const dietLabel = DIET_LABELS[diner.diet] ?? diner.diet;

    if (compatible === false) {
      const detail = dish.diet.reasons[0];
      reasons.push(
        detail === undefined
          ? `not ${dietLabel} — ${diner.label} requires ${dietLabel}`
          : `not ${dietLabel} (${detail}) — ${diner.label} requires ${dietLabel}`
      );
      return { verdict: "avoid", reasons };
    }

    if (compatible === "unknown") {
      reasons.push(
        `${dietLabel} status unclear from the menu — confirm with staff`
      );
    }
  }

  // ── 5. Dislikes ──
  if (diner.dislikes.length > 0) {
    const searchable = [
      ...nameText(dish),
      ...(dish.likelyIngredients ?? []),
      dish.description ?? "",
    ];
    const disliked = findKeywordInAny(searchable, diner.dislikes);
    if (disliked !== null) {
      reasons.push(`${diner.label} would rather avoid ${disliked}`);
    }
  }

  // ── 6. Result ──
  return {
    verdict: reasons.length > 0 ? "caution" : "safe",
    reasons,
  };
}

/**
 * Returns the diners who can eat a dish — its "eligible" set.
 *
 * A diner is eligible when their verdict is anything other than `avoid`.
 * `caution` remains eligible: it is advisory, shown alongside the dish, and the
 * diner is the one who decides. `avoid` never is.
 *
 * The solver builds its entire candidate pool from this function, which is why
 * an allergen conflict cannot resurface later under budget pressure — the dish
 * simply is not in the pool.
 */
export function eligibleDiners(
  dish: EnrichedDish,
  diners: readonly Diner[]
): Diner[] {
  return diners.filter(
    (diner) => dishVerdictForDiner(dish, diner).verdict !== "avoid"
  );
}
