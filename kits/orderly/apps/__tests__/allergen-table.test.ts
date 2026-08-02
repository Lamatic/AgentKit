import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLERGEN_TABLE,
  mapIngredientsToAllergens,
  matchAllergens,
} from "../lib/allergen-table";
import { normalizeText } from "../lib/keyword-match";
import { ALL_ALLERGENS } from "../lib/types";
import type { AllergenId } from "../lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The set of allergen IDs matched, order-independent, for concise assertions. */
function allergensOf(ingredients: string[]): AllergenId[] {
  return mapIngredientsToAllergens(ingredients)
    .map((m) => m.allergen)
    .sort();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("normalizeText", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    assert.equal(normalizeText("  Soy   SAUCE "), "soy sauce");
  });

  it("treats hyphens, underscores, slashes and commas as separators", () => {
    assert.equal(normalizeText("soy-sauce"), "soy sauce");
    assert.equal(normalizeText("soy_sauce"), "soy sauce");
    assert.equal(normalizeText("soy/sauce"), "soy sauce");
    assert.equal(normalizeText("soy,sauce"), "soy sauce");
  });
});

describe("ALLERGEN_TABLE", () => {
  // ── 1. Every EU-14 allergen is represented ──
  it("covers all 14 EU major allergens", () => {
    const covered = new Set(Object.values(ALLERGEN_TABLE));
    for (const allergen of ALL_ALLERGENS) {
      assert.ok(
        covered.has(allergen),
        `no table key maps to "${allergen}" — the EU-14 list must be fully covered`
      );
    }
    assert.equal(covered.size, 14);
  });

  // ── 2. Keys are normalised ──
  it("stores every key in lowercase, trimmed form", () => {
    for (const key of Object.keys(ALLERGEN_TABLE)) {
      assert.equal(key, key.toLowerCase().trim(), `key "${key}" is not normalised`);
    }
  });
});

describe("matchAllergens", () => {
  // ── 3. Straightforward single-ingredient lookups ──
  it("maps representative ingredients to the right allergen group", () => {
    const cases: Array<[string, AllergenId]> = [
      ["prawn", "crustaceans"],
      ["shrimp", "crustaceans"],
      ["octopus", "molluscs"],
      ["almond", "tree-nuts"],
      ["wheat flour", "cereals-gluten"],
      ["tahini", "sesame"],
      ["celeriac", "celery"],
      ["dijon", "mustard"],
      ["lupin", "lupin"],
      ["anchovy", "fish"],
      ["paneer", "milk"],
      ["edamame", "soybeans"],
      ["groundnut", "peanuts"],
      ["mayonnaise", "eggs"],
    ];

    for (const [ingredient, expected] of cases) {
      const matches = matchAllergens(ingredient);
      assert.equal(matches.length, 1, `"${ingredient}" should match exactly one allergen`);
      assert.equal(matches[0].allergen, expected, `"${ingredient}" mapped incorrectly`);
    }
  });

  // ── 4. Case and whitespace insensitivity ──
  it("is insensitive to case and surrounding whitespace", () => {
    for (const variant of ["PRAWN", "Prawn", "  prawn  ", "pRaWn"]) {
      const matches = matchAllergens(variant);
      assert.equal(matches.length, 1, `"${variant}" should still match`);
      assert.equal(matches[0].allergen, "crustaceans");
    }
  });

  // ── 5. Simple plurals ──
  it("matches simple English plurals", () => {
    assert.equal(matchAllergens("prawns")[0]?.allergen, "crustaceans");
    assert.equal(matchAllergens("mussels")[0]?.allergen, "molluscs");
    assert.equal(matchAllergens("eggs")[0]?.allergen, "eggs");
  });

  // ── 6. Longest key wins, and reports the better explanation ──
  it("prefers the longest matching key for the same allergen", () => {
    const matches = matchAllergens("soy sauce");
    assert.equal(matches.length, 1, "soy sauce is one allergen, not two");
    assert.equal(matches[0].allergen, "soybeans");
    assert.equal(
      matches[0].matchedIngredient,
      "soy sauce",
      'should report "soy sauce", not the shorter "soy"'
    );
  });

  it("prefers 'sesame oil' over 'sesame'", () => {
    const matches = matchAllergens("sesame oil");
    assert.equal(matches.length, 1);
    assert.equal(matches[0].matchedIngredient, "sesame oil");
  });

  // ── 7. Word boundaries — the false-positive guard ──
  it("does not match a key that is merely a substring of another word", () => {
    // "egg" must not fire on "eggplant" — an aubergine contains no egg.
    assert.deepEqual(matchAllergens("eggplant"), []);
    // "oat" must not fire on "goat".
    assert.deepEqual(matchAllergens("goat"), []);
    // "cod" must not fire on "codorniz" (quail).
    assert.deepEqual(matchAllergens("codorniz"), []);
  });

  it("still matches keys embedded in a longer phrase at word boundaries", () => {
    const matches = matchAllergens("grilled king prawn with garlic");
    assert.equal(matches.length, 1);
    assert.equal(matches[0].allergen, "crustaceans");
  });

  // ── 8. Unknown input never guesses ──
  it("returns nothing for unrecognised ingredients", () => {
    assert.deepEqual(matchAllergens("rice"), []);
    assert.deepEqual(matchAllergens("courgette"), []);
    assert.deepEqual(matchAllergens("xyzzy"), []);
  });

  it("returns nothing for empty or whitespace-only input", () => {
    assert.deepEqual(matchAllergens(""), []);
    assert.deepEqual(matchAllergens("   "), []);
  });

  // ── 9. Non-English keys ──
  it("recognises ingredient terms in the menu's own language", () => {
    assert.equal(matchAllergens("bacalhau")[0]?.allergen, "fish");
    assert.equal(matchAllergens("queijo")[0]?.allergen, "milk");
    assert.equal(matchAllergens("ebi")[0]?.allergen, "crustaceans");
    assert.equal(matchAllergens("tako")[0]?.allergen, "molluscs");
  });

  // ── 10. Determinism ──
  it("returns identical output for identical input", () => {
    const a = matchAllergens("breaded prawn with soy sauce and sesame");
    const b = matchAllergens("breaded prawn with soy sauce and sesame");
    assert.deepStrictEqual(a, b);
  });
});

describe("mapIngredientsToAllergens", () => {
  // ── 11. Multiple ingredients, deduplicated ──
  it("deduplicates one allergen reported by several ingredients", () => {
    assert.deepEqual(allergensOf(["wheat", "flour", "bread"]), ["cereals-gluten"]);
  });

  it("reports every distinct allergen present", () => {
    assert.deepEqual(allergensOf(["prawn", "wheat", "egg"]), [
      "cereals-gluten",
      "crustaceans",
      "eggs",
    ]);
  });

  // ── 12. Ingredients are matched individually ──
  it("does not form phrases across ingredient boundaries", () => {
    // Neither entry contains a tree nut; "pine" + "nut oil" must not be read
    // as the key "pine nut".
    assert.deepEqual(allergensOf(["pine", "nut oil"]), []);
  });

  // ── 13. Attribution keeps the most specific key ──
  it("attributes an allergen to the longest key matched anywhere in the list", () => {
    const matches = mapIngredientsToAllergens(["soy", "soy sauce"]);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].matchedIngredient, "soy sauce");
  });

  // ── 14. Empty input ──
  it("returns an empty list for no ingredients", () => {
    assert.deepEqual(mapIngredientsToAllergens([]), []);
    assert.deepEqual(mapIngredientsToAllergens(["", "  "]), []);
  });
});
