import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dietVerdict, verdictForDiet } from "../lib/diet-rules";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("dietVerdict — vegetarian", () => {
  // ── 1. Meat and seafood disqualify ──
  it("rejects land meat", () => {
    const verdict = dietVerdict(["pork", "onion"]);
    assert.equal(verdict.vegetarian, false);
    assert.ok(
      verdict.reasons.some((r) => r.includes("pork")),
      "reason should name the disqualifying ingredient"
    );
  });

  it("rejects seafood — fish is not vegetarian", () => {
    assert.equal(dietVerdict(["cod", "potato"]).vegetarian, false);
    assert.equal(dietVerdict(["prawn"]).vegetarian, false);
  });

  it("rejects hidden animal derivatives", () => {
    // Dashi is a fish stock; a broth containing it is not vegetarian even
    // though nothing in the name suggests fish.
    assert.equal(dietVerdict(["dashi", "seaweed"]).vegetarian, false);
    assert.equal(dietVerdict(["gelatin", "sugar"]).vegetarian, false);
  });

  // ── 2. Plant dishes pass ──
  it("accepts plant and dairy ingredients", () => {
    assert.equal(dietVerdict(["tofu", "soy sauce"]).vegetarian, true);
    assert.equal(dietVerdict(["cheese", "tomato"]).vegetarian, true);
    assert.equal(dietVerdict(["rice", "vegetable"]).vegetarian, true);
  });

  // ── 2b. Game birds and offal — the usual blind spots ──
  //
  // Regression: an end-to-end run against a real menu classified "Deep Bake
  // Goose" as vegetarian AND vegan, because the meat list had duck and turkey
  // but not goose. A gap here does not produce a vague answer — it produces a
  // confident wrong one, on a plate of meat.
  it("rejects game birds, not just common poultry", () => {
    for (const bird of ["goose", "quail", "pheasant", "partridge", "pigeon", "ostrich"]) {
      const verdict = dietVerdict([bird]);
      assert.equal(verdict.vegetarian, false, `"${bird}" was treated as vegetarian`);
      assert.equal(verdict.vegan, false, `"${bird}" was treated as vegan`);
    }
  });

  it("rejects game, offal and cured meats", () => {
    for (const meat of [
      "boar", "bison", "venison", "rabbit", "kangaroo",
      "liver", "kidney", "foie gras", "marrow", "tripe",
      "prosciutto", "bresaola", "mortadella", "guanciale", "jerky",
    ]) {
      assert.equal(
        dietVerdict([meat]).vegetarian,
        false,
        `"${meat}" was treated as vegetarian`
      );
    }
  });

  it("rejects meat named in a non-English menu term", () => {
    for (const term of ["ganso", "pato", "cordero", "canard", "agneau", "jambon"]) {
      assert.equal(
        dietVerdict([term]).vegetarian,
        false,
        `"${term}" was treated as vegetarian`
      );
    }
  });
});

describe("dietVerdict — the dish name disqualifies but never approves", () => {
  // ── 2c. Names are a one-way signal ──
  //
  // Regression: a dish whose ingredient list came back empty was reported as
  // fully "unknown" even when its own name said "Pork Belly".
  it("uses the name to reject when there are no ingredients", () => {
    const verdict = dietVerdict([], ["Pork Belly"]);
    assert.equal(verdict.vegetarian, false);
    assert.equal(verdict.halal, false);
    assert.ok(verdict.reasons.some((r) => r.includes("pork")));
  });

  it("does not let a harmless name approve a dish with no ingredients", () => {
    // Nothing in "Chef's Special" is incriminating — but absence of the word
    // "pork" is not evidence of vegetarianism.
    const verdict = dietVerdict([], ["Chef's Special"]);
    assert.equal(verdict.vegetarian, "unknown");
    assert.equal(verdict.vegan, "unknown");
    assert.equal(verdict.glutenFree, "unknown");
  });

  it("still concludes normally when ingredients are present", () => {
    const verdict = dietVerdict(["rice", "vegetable"], ["Vegetable Rice"]);
    assert.equal(verdict.vegetarian, true);
    assert.equal(verdict.vegan, true);
  });

  it("lets the name override an ingredient list that missed the meat", () => {
    // The model listed only the garnish; the title names the animal.
    const verdict = dietVerdict(["herbs", "lemon"], ["Roast Goose"]);
    assert.equal(verdict.vegetarian, false);
  });
});

describe("dietVerdict — vegan", () => {
  // ── 3. Dairy and egg disqualify vegan but not vegetarian ──
  it("separates vegetarian from vegan on dairy", () => {
    const verdict = dietVerdict(["cheese", "tomato"]);
    assert.equal(verdict.vegetarian, true);
    assert.equal(verdict.vegan, false);
    assert.ok(verdict.reasons.some((r) => r.includes("cheese")));
  });

  it("separates vegetarian from vegan on egg", () => {
    const verdict = dietVerdict(["egg", "flour"]);
    assert.equal(verdict.vegetarian, true);
    assert.equal(verdict.vegan, false);
  });

  it("treats honey as non-vegan", () => {
    const verdict = dietVerdict(["honey", "oat"]);
    assert.equal(verdict.vegetarian, true);
    assert.equal(verdict.vegan, false);
  });

  // ── 4. Fully plant-based passes both ──
  it("accepts a plant-only dish as both vegetarian and vegan", () => {
    const verdict = dietVerdict(["tofu", "soy sauce"]);
    assert.equal(verdict.vegetarian, true);
    assert.equal(verdict.vegan, true);
  });

  // ── 5. Meat implies not vegan ──
  it("marks anything non-vegetarian as non-vegan too", () => {
    assert.equal(dietVerdict(["beef"]).vegan, false);
    assert.equal(dietVerdict(["tuna"]).vegan, false);
  });
});

describe("dietVerdict — halal", () => {
  // ── 6. Pork and alcohol are firm rejections ──
  it("rejects pork outright", () => {
    const verdict = dietVerdict(["pork"]);
    assert.equal(verdict.halal, false);
    assert.ok(verdict.reasons.some((r) => r.includes("not halal")));
  });

  it("rejects alcohol, including cooking wine and mirin", () => {
    assert.equal(dietVerdict(["wine", "beef"]).halal, false);
    assert.equal(dietVerdict(["mirin", "chicken"]).halal, false);
  });

  // ── 7. Non-pork meat is genuinely unknown ──
  it("returns 'unknown' for non-pork meat rather than guessing", () => {
    // Whether chicken is halal depends on the slaughter method, which no
    // photograph of a menu can establish. Answering false would wrongly
    // condemn a halal kitchen; answering true would be unsafe.
    const verdict = dietVerdict(["chicken"]);
    assert.equal(verdict.vegetarian, false);
    assert.equal(verdict.halal, "unknown");
    assert.ok(
      verdict.reasons.some((r) => r.includes("confirm with staff")),
      "an unknown halal verdict must tell the user to confirm"
    );
  });

  it("returns 'unknown' for fish too", () => {
    assert.equal(dietVerdict(["salmon"]).halal, "unknown");
  });

  // ── 8. Plant dishes are permissible ──
  it("accepts a dish with no meat and no alcohol", () => {
    assert.equal(dietVerdict(["rice", "vegetable"]).halal, true);
    assert.equal(dietVerdict(["cheese", "tomato"]).halal, true);
  });

  it("prefers the pork reason over the alcohol reason when both apply", () => {
    const verdict = dietVerdict(["pork", "wine"]);
    assert.equal(verdict.halal, false);
    assert.ok(verdict.reasons.some((r) => r.includes("pork")));
  });
});

describe("dietVerdict — gluten-free", () => {
  // ── 9. Delegates to the allergen table, so the two can never disagree ──
  it("rejects gluten-containing cereals", () => {
    assert.equal(dietVerdict(["wheat"]).glutenFree, false);
    assert.equal(dietVerdict(["barley", "water"]).glutenFree, false);
    assert.equal(dietVerdict(["panko", "pork"]).glutenFree, false);
  });

  it("accepts dishes with no gluten cereal detected", () => {
    assert.equal(dietVerdict(["rice", "vegetable"]).glutenFree, true);
    assert.equal(dietVerdict(["potato", "olive oil"]).glutenFree, true);
  });

  it("names the gluten source in the reason", () => {
    const verdict = dietVerdict(["panko", "pork"]);
    assert.ok(verdict.reasons.some((r) => r.includes("panko")));
  });
});

describe("dietVerdict — no evidence", () => {
  // ── 10. Absence of ingredients is not absence of allergens ──
  it("returns 'unknown' for every field when there are no ingredients", () => {
    const verdict = dietVerdict([]);
    assert.equal(verdict.vegetarian, "unknown");
    assert.equal(verdict.vegan, "unknown");
    assert.equal(verdict.halal, "unknown");
    assert.equal(verdict.glutenFree, "unknown");
    assert.ok(verdict.reasons.length > 0, "must explain why nothing was concluded");
  });

  it("treats blank entries as no evidence", () => {
    assert.equal(dietVerdict(["", "   "]).vegetarian, "unknown");
  });
});

describe("dietVerdict — reason discipline", () => {
  // ── 11. Every negative verdict is explainable ──
  it("never returns a false verdict without a reason", () => {
    const samples = [
      ["pork"],
      ["cod"],
      ["cheese"],
      ["egg"],
      ["wine"],
      ["wheat"],
      ["honey"],
      ["panko", "prawn", "mayonnaise"],
    ];

    for (const ingredients of samples) {
      const verdict = dietVerdict(ingredients);
      const hasFalse = [
        verdict.vegetarian,
        verdict.vegan,
        verdict.halal,
        verdict.glutenFree,
      ].includes(false);

      if (hasFalse) {
        assert.ok(
          verdict.reasons.length > 0,
          `[${ingredients.join(", ")}] produced a false verdict with no reason`
        );
      }
    }
  });

  // ── 12. Determinism ──
  it("returns identical output for identical input", () => {
    const a = dietVerdict(["panko", "prawn", "mayonnaise"]);
    const b = dietVerdict(["panko", "prawn", "mayonnaise"]);
    assert.deepStrictEqual(a, b);
  });
});

describe("verdictForDiet", () => {
  // ── 13. Field mapping ──
  it("reads the right field for each diet ID", () => {
    const verdict = dietVerdict(["cheese", "wheat"]);
    assert.equal(verdictForDiet(verdict, "vegetarian"), verdict.vegetarian);
    assert.equal(verdictForDiet(verdict, "vegan"), verdict.vegan);
    assert.equal(verdictForDiet(verdict, "halal"), verdict.halal);
    assert.equal(verdictForDiet(verdict, "gluten-free"), verdict.glutenFree);
  });

  it("maps 'gluten-free' to glutenFree, not to a missing field", () => {
    const verdict = dietVerdict(["wheat"]);
    assert.equal(verdictForDiet(verdict, "gluten-free"), false);
  });
});

describe("dietVerdict — halal uncertainty from rennet", () => {
  // ── 14. Source-dependent ingredients ──
  //
  // Rennet may be microbial or animal-derived, and if animal-derived the answer
  // turns on slaughter method. A menu cannot say which, so "unknown" is the
  // only honest verdict.
  it("returns 'unknown' halal when rennet is named", () => {
    const verdict = dietVerdict(["cheese", "rennet"]);
    assert.equal(verdict.halal, "unknown");
    assert.ok(verdict.reasons.some((r) => r.includes("rennet")));
    assert.ok(verdict.reasons.some((r) => r.includes("confirm with staff")));
  });

  it("does not infer rennet from the mere presence of cheese", () => {
    // Marking every cheese dish uncertain would flag most Western menus and
    // drown the signal. Only an explicit mention counts.
    assert.equal(dietVerdict(["cheese", "tomato"]).halal, true);
  });

  it("keeps pork and alcohol as firm rejections, not uncertainty", () => {
    assert.equal(dietVerdict(["cheese", "rennet", "pork"]).halal, false);
    assert.equal(dietVerdict(["cheese", "rennet", "wine"]).halal, false);
  });
});
