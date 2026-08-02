import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DeepDiveRequestSchema,
  FlowResultSchema,
  ScanRequestSchema,
  fieldErrors,
  isPubliclyFetchableImageUrl,
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

  // ── 2b. Duplicate diner IDs ──
  //
  // The solver tracks coverage in a Set keyed on diner ID, so two diners
  // sharing an ID would silently count as one and leave someone unfed without
  // ever appearing in `unfed`.
  it("rejects duplicate diner ids", () => {
    assert.throws(() =>
      ScanRequestSchema.parse({
        ...VALID_REQUEST,
        diners: [
          { id: "same", label: "Priya" },
          { id: "same", label: "Sam" },
        ],
      })
    );
  });

  it("accepts distinct diner ids", () => {
    assert.doesNotThrow(() =>
      ScanRequestSchema.parse({
        ...VALID_REQUEST,
        diners: [
          { id: "a", label: "Priya" },
          { id: "b", label: "Sam" },
        ],
      })
    );
  });
});

describe("isPubliclyFetchableImageUrl", () => {
  // ── 2c. The vision node fetches this URL server-side ──
  //
  // An unvalidated URL turns the flow into a request proxy: point it at a cloud
  // metadata endpoint or a service on the loopback interface and the response,
  // or merely the timing, leaks. These are the addresses that must never reach it.
  it("accepts ordinary public https image URLs", () => {
    for (const url of [
      "https://example.com/menu.jpg",
      "https://raw.githubusercontent.com/owner/repo/main/menu.jpg",
      "https://abc123.public.blob.vercel-storage.com/menus/1-menu.jpg",
      "https://cdn.example.co.uk:8443/a/b/menu.png?v=2",
    ]) {
      assert.equal(isPubliclyFetchableImageUrl(url), true, `${url} should be allowed`);
    }
  });

  it("rejects non-https schemes, including paste-only ones", () => {
    for (const url of [
      "http://example.com/menu.jpg",
      "file:///etc/passwd",
      "ftp://example.com/menu.jpg",
      "data:image/png;base64,iVBORw0KGgo=",
      "blob:https://example.com/8f7d-4a2b",
      "javascript:alert(1)",
    ]) {
      assert.equal(isPubliclyFetchableImageUrl(url), false, `${url} should be rejected`);
    }
  });

  it("rejects loopback and localhost", () => {
    for (const url of [
      "https://localhost/menu.jpg",
      "https://127.0.0.1/menu.jpg",
      "https://127.1.2.3/menu.jpg",
      "https://[::1]/menu.jpg",
      "https://app.localhost/menu.jpg",
    ]) {
      assert.equal(isPubliclyFetchableImageUrl(url), false, `${url} should be rejected`);
    }
  });

  it("rejects private, link-local and metadata addresses", () => {
    for (const url of [
      "https://10.0.0.5/menu.jpg",
      "https://192.168.1.1/menu.jpg",
      "https://172.16.0.1/menu.jpg",
      "https://172.31.255.255/menu.jpg",
      "https://169.254.169.254/latest/meta-data/", // cloud metadata
      "https://metadata.google.internal/computeMetadata/v1/",
      "https://0.0.0.0/menu.jpg",
      "https://[fe80::1]/menu.jpg",
      "https://[fd00::1]/menu.jpg",
    ]) {
      assert.equal(isPubliclyFetchableImageUrl(url), false, `${url} should be rejected`);
    }
  });

  it("does not reject public addresses that merely look similar", () => {
    // 172.32.x is outside the private 172.16-31 range; 11.x is public.
    assert.equal(isPubliclyFetchableImageUrl("https://172.32.0.1/menu.jpg"), true);
    assert.equal(isPubliclyFetchableImageUrl("https://11.0.0.1/menu.jpg"), true);
  });

  it("rejects malformed input", () => {
    for (const url of ["", "not-a-url", "https://", "   "]) {
      assert.equal(isPubliclyFetchableImageUrl(url), false, `${url} should be rejected`);
    }
  });

  it("is enforced by ScanRequestSchema, not merely available", () => {
    assert.throws(() =>
      ScanRequestSchema.parse({ ...VALID_REQUEST, imageUrl: "http://127.0.0.1/menu.jpg" })
    );
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
