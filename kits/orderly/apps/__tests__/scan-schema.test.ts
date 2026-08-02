import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DeepDiveRequestSchema,
  FlowResultSchema,
  ScanRequestSchema,
  fieldErrors,
  parseFlowResult,
} from "../lib/scan-schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_REQUEST = {
  imageUrl: "https://example.com/menu.jpg",
  targetLanguage: "English",
  diners: [{ id: "d1", label: "Priya", avoidAllergens: ["tree-nuts"] }],
  budget: { amount: 60, currency: "EUR" },
};

// ---------------------------------------------------------------------------
// Inbound — strict
// ---------------------------------------------------------------------------

describe("ScanRequestSchema — accepts well-formed requests", () => {
  // ── 1. The happy path, with defaults filled ──
  it("parses a valid request and applies defaults", () => {
    const parsed = ScanRequestSchema.parse(VALID_REQUEST);

    assert.equal(parsed.servingModel, "shared", "sharing is the default");
    assert.equal(parsed.diners[0].diet, null);
    assert.deepEqual(parsed.diners[0].dislikes, []);
  });

  it("accepts a null budget", () => {
    const parsed = ScanRequestSchema.parse({ ...VALID_REQUEST, budget: null });
    assert.equal(parsed.budget, null);
  });

  it("accepts a party of eight", () => {
    const diners = Array.from({ length: 8 }, (_, i) => ({
      id: `d${i}`,
      label: `Diner ${i}`,
    }));
    assert.doesNotThrow(() =>
      ScanRequestSchema.parse({ ...VALID_REQUEST, diners })
    );
  });
});

describe("ScanRequestSchema — rejects malformed requests", () => {
  // ── 2. Each rejection is a real class of bad input ──
  it("rejects a non-URL image", () => {
    assert.throws(() =>
      ScanRequestSchema.parse({ ...VALID_REQUEST, imageUrl: "not-a-url" })
    );
  });

  it("rejects an empty party", () => {
    assert.throws(() => ScanRequestSchema.parse({ ...VALID_REQUEST, diners: [] }));
  });

  it("rejects a party larger than the solver is designed for", () => {
    const diners = Array.from({ length: 9 }, (_, i) => ({
      id: `d${i}`,
      label: `Diner ${i}`,
    }));
    assert.throws(() => ScanRequestSchema.parse({ ...VALID_REQUEST, diners }));
  });

  it("rejects a non-positive budget", () => {
    for (const amount of [0, -10]) {
      assert.throws(
        () =>
          ScanRequestSchema.parse({
            ...VALID_REQUEST,
            budget: { amount, currency: "EUR" },
          }),
        `budget of ${amount} should be rejected`
      );
    }
  });

  it("rejects a malformed currency code", () => {
    assert.throws(() =>
      ScanRequestSchema.parse({
        ...VALID_REQUEST,
        budget: { amount: 60, currency: "EUROS" },
      })
    );
  });

  it("rejects an allergen outside the EU-14", () => {
    assert.throws(() =>
      ScanRequestSchema.parse({
        ...VALID_REQUEST,
        diners: [{ id: "d1", label: "P", avoidAllergens: ["kryptonite"] }],
      })
    );
  });

  it("rejects a missing target language", () => {
    const { targetLanguage, ...withoutLanguage } = VALID_REQUEST;
    void targetLanguage;
    assert.throws(() => ScanRequestSchema.parse(withoutLanguage));
  });
});

describe("DeepDiveRequestSchema", () => {
  // ── 3. Optional context defaults rather than failing ──
  it("defaults the optional context fields", () => {
    const parsed = DeepDiveRequestSchema.parse({
      dishName: "Bacalhau à Brás",
      targetLanguage: "English",
    });
    assert.equal(parsed.dishDescription, "");
    assert.equal(parsed.allergyContext, "");
  });

  it("requires a dish name", () => {
    assert.throws(() =>
      DeepDiveRequestSchema.parse({ dishName: "", targetLanguage: "English" })
    );
  });
});

// ---------------------------------------------------------------------------
// Outbound — permissive
// ---------------------------------------------------------------------------

describe("FlowResultSchema — tolerates what models actually return", () => {
  // ── 4. Complete, well-formed output ──
  it("parses a complete result", () => {
    const parsed = FlowResultSchema.parse({
      detectedLanguage: "Portuguese",
      currency: "EUR",
      notes: "",
      dishes: [
        {
          nameOriginal: "Caldo Verde",
          nameTranslated: "Green Broth",
          description: "Kale and potato soup.",
          likelyIngredients: ["kale", "potato"],
          priceRaw: "€6",
          category: "starter",
          confidence: "high",
        },
      ],
    });

    assert.equal(parsed.dishes.length, 1);
    assert.equal(parsed.dishes[0].nameOriginal, "Caldo Verde");
  });

  // ── 5. Missing fields degrade, never throw ──
  it("defaults a missing dishes array to empty", () => {
    const parsed = FlowResultSchema.parse({ detectedLanguage: "Japanese" });
    assert.deepEqual(parsed.dishes, []);
    assert.equal(parsed.currency, "");
  });

  it("parses a dish carrying only a name", () => {
    const parsed = FlowResultSchema.parse({
      dishes: [{ nameOriginal: "Tonkatsu" }],
    });
    assert.equal(parsed.dishes[0].nameOriginal, "Tonkatsu");
    assert.deepEqual(parsed.dishes[0].likelyIngredients, []);
    assert.equal(parsed.dishes[0].confidence, "medium");
  });

  it("parses an entirely empty object", () => {
    assert.doesNotThrow(() => FlowResultSchema.parse({}));
  });

  // ── 6. Type coercion for the shapes models drift into ──
  it("accepts a number where a price string was specified", () => {
    const parsed = FlowResultSchema.parse({
      dishes: [{ nameOriginal: "Rice", priceRaw: 980 }],
    });
    assert.equal(parsed.dishes[0].priceRaw, "980");
  });

  it("accepts a bare string where an ingredient array was specified", () => {
    const parsed = FlowResultSchema.parse({
      dishes: [{ nameOriginal: "Rice", likelyIngredients: "rice" }],
    });
    assert.deepEqual(parsed.dishes[0].likelyIngredients, ["rice"]);
  });

  it("splits a comma-separated ingredient string", () => {
    const parsed = FlowResultSchema.parse({
      dishes: [{ nameOriginal: "Curry", likelyIngredients: "rice, coconut, chilli" }],
    });
    assert.deepEqual(parsed.dishes[0].likelyIngredients, [
      "rice",
      "coconut",
      "chilli",
    ]);
  });

  it("turns null fields into empty values rather than failing", () => {
    const parsed = FlowResultSchema.parse({
      dishes: [{ nameOriginal: "Rice", description: null, likelyIngredients: null }],
    });
    assert.equal(parsed.dishes[0].description, "");
    assert.deepEqual(parsed.dishes[0].likelyIngredients, []);
  });

  // ── 7. Confidence normalisation ──
  it("maps 'low' confidence to 'unknown' so the line is not trusted", () => {
    const parsed = FlowResultSchema.parse({
      dishes: [{ nameOriginal: "???", confidence: "low" }],
    });
    assert.equal(parsed.dishes[0].confidence, "unknown");
  });

  it("normalises casing and unrecognised confidence values", () => {
    assert.equal(
      FlowResultSchema.parse({ dishes: [{ nameOriginal: "a", confidence: "HIGH" }] })
        .dishes[0].confidence,
      "high"
    );
    assert.equal(
      FlowResultSchema.parse({ dishes: [{ nameOriginal: "a", confidence: "meh" }] })
        .dishes[0].confidence,
      "medium"
    );
  });
});

describe("parseFlowResult — never throws", () => {
  // ── 8. The safety net ──
  it("returns an empty menu with a note for unparseable input", () => {
    for (const garbage of [null, undefined, "a string", 42, []]) {
      const result = parseFlowResult(garbage);
      assert.deepEqual(result.dishes, []);
      assert.ok(
        result.notes.length > 0,
        "the user must be told the menu could not be read"
      );
    }
  });

  it("passes valid input through unchanged", () => {
    const result = parseFlowResult({
      currency: "JPY",
      dishes: [{ nameOriginal: "とんかつ" }],
    });
    assert.equal(result.currency, "JPY");
    assert.equal(result.dishes.length, 1);
  });
});

describe("fieldErrors", () => {
  // ── 9. Errors the UI can attach to inputs ──
  it("maps issues to one message per field", () => {
    const parsed = ScanRequestSchema.safeParse({
      ...VALID_REQUEST,
      imageUrl: "not-a-url",
      diners: [],
    });

    assert.equal(parsed.success, false);
    if (parsed.success) return;

    const errors = fieldErrors(parsed.error);
    assert.ok("imageUrl" in errors);
    assert.ok("diners" in errors);
    for (const message of Object.values(errors)) {
      assert.equal(typeof message, "string");
      assert.ok(message.length > 0);
    }
  });
});
