import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectAllergens,
  dishId,
  dishVerdictForDiner,
  eligibleDiners,
  enrichDish,
  enrichDishes,
} from "../lib/allergen-engine";
import type { Diner, RawDish } from "../lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDish(overrides: Partial<RawDish> = {}): RawDish {
  return {
    nameOriginal: "Test Dish",
    likelyIngredients: [],
    priceRaw: "€10",
    ...overrides,
  };
}

function makeDiner(overrides: Partial<Diner> = {}): Diner {
  return {
    id: "d1",
    label: "Diner",
    avoidAllergens: [],
    diet: null,
    dislikes: [],
    ...overrides,
  };
}

/** Enriches a single dish at index 0 for concise assertions. */
function enrich(raw: Partial<RawDish>, currencyHint?: string) {
  return enrichDish(makeDish(raw), 0, currencyHint);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("dishId", () => {
  // ── 1. Stability and uniqueness ──
  it("is stable for the same name and position", () => {
    assert.equal(dishId("Ebi Tempura", 3), dishId("Ebi Tempura", 3));
  });

  it("distinguishes repeated names at different positions", () => {
    assert.notEqual(dishId("House Salad", 2), dishId("House Salad", 9));
  });

  it("handles non-Latin scripts without collapsing to empty", () => {
    const id = dishId("えび天", 1);
    assert.ok(id.length > 0);
    assert.notEqual(id, "dish-1", "should retain the script, not fall back");
  });

  it("falls back to a positional ID for an unusable name", () => {
    assert.equal(dishId("", 4), "dish-4");
    assert.equal(dishId("!!!", 4), "dish-4");
  });
});

describe("detectAllergens — provenance", () => {
  // ── 2. Name matches are firm ──
  it("marks an allergen named in the dish title as 'contains'", () => {
    // The restaurant printed "Ebi Tempura". It has told us there is shrimp.
    const hits = detectAllergens(makeDish({ nameOriginal: "Ebi Tempura" }));
    const crustacean = hits.find((h) => h.allergen === "crustaceans");
    assert.ok(crustacean, "should detect crustaceans from the name");
    assert.equal(crustacean.certainty, "contains");
  });

  it("marks an allergen named in a translated title as 'contains'", () => {
    const hits = detectAllergens(
      makeDish({ nameOriginal: "えび天", nameTranslated: "Prawn Tempura" })
    );
    assert.equal(
      hits.find((h) => h.allergen === "crustaceans")?.certainty,
      "contains"
    );
  });

  // ── 3. Inferred ingredients are tentative ──
  it("marks an allergen inferred from ingredients as 'may-contain'", () => {
    // Nothing in "Yasai Itame" says soy. The model guessed there is soy sauce.
    const hits = detectAllergens(
      makeDish({
        nameOriginal: "Yasai Itame",
        likelyIngredients: ["soy sauce", "cabbage"],
      })
    );
    const soy = hits.find((h) => h.allergen === "soybeans");
    assert.ok(soy);
    assert.equal(soy.certainty, "may-contain");
  });

  it("marks an allergen found only in the model's description as 'may-contain'", () => {
    const hits = detectAllergens(
      makeDish({
        nameOriginal: "Tonkatsu",
        description: "Breaded, deep-fried pork cutlet.",
      })
    );
    assert.equal(
      hits.find((h) => h.allergen === "cereals-gluten")?.certainty,
      "may-contain"
    );
  });

  // ── 4. Name wins over inference for the same allergen ──
  it("does not downgrade a name match to may-contain", () => {
    const hits = detectAllergens(
      makeDish({
        nameOriginal: "Prawn Curry",
        likelyIngredients: ["prawn", "coconut"],
      })
    );
    const crustacean = hits.filter((h) => h.allergen === "crustaceans");
    assert.equal(crustacean.length, 1, "one hit per allergen");
    assert.equal(crustacean[0].certainty, "contains");
  });

  // ── 5. No detection is not a clean bill of health ──
  it("returns an empty list when nothing is detected", () => {
    const hits = detectAllergens(
      makeDish({ nameOriginal: "Steamed Rice", likelyIngredients: ["rice"] })
    );
    assert.deepEqual(hits, []);
  });
});

describe("enrichDish", () => {
  // ── 6. Unreadable detection ──
  it("marks a low-confidence line as unreadable", () => {
    assert.equal(enrich({ confidence: "unknown" }).unreadable, true);
  });

  it("marks a nameless line as unreadable", () => {
    assert.equal(enrich({ nameOriginal: "   " }).unreadable, true);
  });

  it("does not mark a normal line as unreadable", () => {
    assert.equal(enrich({ confidence: "high" }).unreadable, false);
  });

  // ── 7. Price passthrough ──
  it("parses the price and keeps null when unparseable", () => {
    assert.deepEqual(enrich({ priceRaw: "¥980" }).price, {
      amount: 980,
      currency: "JPY",
    });
    assert.equal(enrich({ priceRaw: "market price" }).price, null);
    assert.equal(enrich({ priceRaw: undefined }).price, null);
  });

  it("applies the menu-level currency hint", () => {
    assert.equal(enrich({ priceRaw: "980" }, "JPY").price?.currency, "JPY");
  });

  // ── 8. Batch enrichment ──
  it("assigns distinct IDs across a menu", () => {
    const dishes = enrichDishes([
      makeDish({ nameOriginal: "Soup" }),
      makeDish({ nameOriginal: "Soup" }),
    ]);
    assert.notEqual(dishes[0].id, dishes[1].id);
  });
});

describe("dishVerdictForDiner", () => {
  // ── 9. The case the app exists for ──
  it("returns avoid when a dish conflicts with an avoided allergen", () => {
    const dish = enrich({
      nameOriginal: "Ebi Tempura",
      likelyIngredients: ["prawn", "wheat"],
    });
    const diner = makeDiner({ label: "Sam", avoidAllergens: ["crustaceans"] });

    const result = dishVerdictForDiner(dish, diner);
    assert.equal(result.verdict, "avoid");
    assert.ok(
      result.reasons.some((r) => r.includes("crustaceans")),
      "reason must name the allergen"
    );
    assert.ok(
      result.reasons.some((r) => r.includes("Sam")),
      "reason must name the diner it applies to"
    );
  });

  it("treats a may-contain allergen as disqualifying, not advisory", () => {
    // The model only inferred soy; there is no soy in the dish's name. A diner
    // who avoids soy still must not be served it on the strength of a guess.
    const dish = enrich({
      nameOriginal: "Yasai Itame",
      likelyIngredients: ["soy sauce", "cabbage"],
    });
    const diner = makeDiner({ avoidAllergens: ["soybeans"] });

    const result = dishVerdictForDiner(dish, diner);
    assert.equal(result.verdict, "avoid");
    assert.ok(result.reasons.some((r) => r.includes("may contain")));
  });

  // ── 10. Clean dishes ──
  it("returns safe for an unconstrained diner and an ordinary dish", () => {
    const dish = enrich({
      nameOriginal: "Steamed Rice",
      likelyIngredients: ["rice", "vegetable"],
    });
    const result = dishVerdictForDiner(dish, makeDiner());
    assert.equal(result.verdict, "safe");
    assert.deepEqual(result.reasons, []);
  });

  // ── 11. Diet conflicts ──
  it("returns avoid when the dish breaks the diner's diet", () => {
    const dish = enrich({
      nameOriginal: "Tonkatsu",
      likelyIngredients: ["pork", "panko"],
    });
    const diner = makeDiner({ label: "Priya", diet: "vegetarian" });

    const result = dishVerdictForDiner(dish, diner);
    assert.equal(result.verdict, "avoid");
    assert.ok(result.reasons.some((r) => r.includes("vegetarian")));
  });

  it("returns caution — not safe — when diet compatibility is unknown", () => {
    // Chicken may or may not be halal; the menu cannot say.
    const dish = enrich({
      nameOriginal: "Grilled Chicken",
      likelyIngredients: ["chicken"],
    });
    const diner = makeDiner({ diet: "halal" });

    const result = dishVerdictForDiner(dish, diner);
    assert.equal(result.verdict, "caution");
    assert.ok(result.reasons.some((r) => r.includes("confirm with staff")));
  });

  // ── 12. Unreadable lines ──
  it("returns avoid for an unreadable line regardless of constraints", () => {
    const dish = enrich({ confidence: "unknown" });
    const result = dishVerdictForDiner(dish, makeDiner());
    assert.equal(result.verdict, "avoid");
  });

  // ── 13. Allergens outrank diet in the reported reason ──
  it("reports the allergen conflict when both an allergen and a diet fail", () => {
    const dish = enrich({
      nameOriginal: "Prawn Tempura",
      likelyIngredients: ["prawn", "wheat"],
    });
    const diner = makeDiner({
      avoidAllergens: ["crustaceans"],
      diet: "vegetarian",
    });

    const result = dishVerdictForDiner(dish, diner);
    assert.equal(result.verdict, "avoid");
    assert.ok(result.reasons.every((r) => !r.includes("requires vegetarian")));
  });

  // ── 14. Dislikes are soft ──
  it("returns caution for a disliked ingredient, not avoid", () => {
    const dish = enrich({
      nameOriginal: "Coriander Salad",
      likelyIngredients: ["coriander", "lettuce"],
    });
    const diner = makeDiner({ label: "Alex", dislikes: ["coriander"] });

    const result = dishVerdictForDiner(dish, diner);
    assert.equal(result.verdict, "caution");
    assert.ok(result.reasons.some((r) => r.includes("Alex")));
  });

  // ── 15. Every non-safe verdict is explainable ──
  it("never returns a non-safe verdict without a reason", () => {
    const dish = enrich({
      nameOriginal: "Prawn Tempura",
      likelyIngredients: ["prawn", "wheat"],
    });
    for (const diner of [
      makeDiner({ avoidAllergens: ["crustaceans"] }),
      makeDiner({ diet: "vegan" }),
      makeDiner({ dislikes: ["prawn"] }),
    ]) {
      const result = dishVerdictForDiner(dish, diner);
      if (result.verdict !== "safe") {
        assert.ok(
          result.reasons.length > 0,
          `${result.verdict} verdict with no reason`
        );
      }
    }
  });
});

describe("eligibleDiners", () => {
  // ── 16. Eligibility excludes only 'avoid' ──
  it("excludes diners who must avoid the dish", () => {
    const dish = enrich({
      nameOriginal: "Ebi Tempura",
      likelyIngredients: ["prawn"],
    });
    const sam = makeDiner({ id: "sam", label: "Sam", avoidAllergens: ["crustaceans"] });
    const alex = makeDiner({ id: "alex", label: "Alex" });

    const eligible = eligibleDiners(dish, [sam, alex]);
    assert.deepEqual(eligible.map((d) => d.id), ["alex"]);
  });

  it("keeps diners whose verdict is only caution", () => {
    const dish = enrich({
      nameOriginal: "Grilled Chicken",
      likelyIngredients: ["chicken"],
    });
    const diner = makeDiner({ id: "h", diet: "halal" });

    // "unknown" halal status is advisory — the diner decides, so they remain
    // eligible and the caution is surfaced alongside.
    assert.deepEqual(eligibleDiners(dish, [diner]).map((d) => d.id), ["h"]);
  });

  it("returns an empty list when nobody can eat the dish", () => {
    const dish = enrich({ nameOriginal: "Prawn Toast", likelyIngredients: ["prawn"] });
    const diners = [
      makeDiner({ id: "a", avoidAllergens: ["crustaceans"] }),
      makeDiner({ id: "b", avoidAllergens: ["crustaceans"] }),
    ];
    assert.deepEqual(eligibleDiners(dish, diners), []);
  });
});
