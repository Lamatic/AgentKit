import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectCurrency,
  formatPrice,
  parsePrice,
  sumPrices,
} from "../lib/price";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("detectCurrency", () => {
  // ── 1. Symbols ──
  it("recognises common currency symbols", () => {
    assert.equal(detectCurrency("$12.50"), "USD");
    assert.equal(detectCurrency("€9"), "EUR");
    assert.equal(detectCurrency("£7.20"), "GBP");
    assert.equal(detectCurrency("¥980"), "JPY");
    assert.equal(detectCurrency("₹250"), "INR");
  });

  it("prefers the longer symbol when one contains another", () => {
    // R$ must not be read as a bare $.
    assert.equal(detectCurrency("R$ 25,00"), "BRL");
  });

  // ── 2. Written ISO codes ──
  it("recognises ISO codes written out", () => {
    assert.equal(detectCurrency("980 JPY"), "JPY");
    assert.equal(detectCurrency("12.50 usd"), "USD");
  });

  it("recognises an ISO code butted against the digits", () => {
    // `\b` sits between a letter and a digit, so a word-boundary match missed
    // these entirely. Menus and OCR both produce them.
    assert.equal(detectCurrency("980JPY"), "JPY");
    assert.equal(detectCurrency("12.50USD"), "USD");
    assert.equal(detectCurrency("USD12"), "USD");
  });

  it("still refuses to find a code inside a longer word", () => {
    assert.equal(detectCurrency("CRUSADE"), null);
    assert.equal(detectCurrency("MEUROPE"), null);
  });

  // ── 3. Nothing recognisable ──
  it("returns null when no currency is present", () => {
    assert.equal(detectCurrency("980"), null);
    assert.equal(detectCurrency(""), null);
  });
});

describe("parsePrice — the documented formats", () => {
  // ── 4. The canonical cases ──
  it("parses a symbol-prefixed integer price", () => {
    assert.deepEqual(parsePrice("¥980"), { amount: 980, currency: "JPY" });
  });

  it("parses a symbol-prefixed decimal price", () => {
    assert.deepEqual(parsePrice("$12.50"), { amount: 12.5, currency: "USD" });
  });

  it("parses European grouping with a comma decimal", () => {
    assert.deepEqual(parsePrice("1.200,50 €"), {
      amount: 1200.5,
      currency: "EUR",
    });
  });

  it("parses Anglo grouping with a dot decimal", () => {
    assert.deepEqual(parsePrice("1,200.50", "USD"), {
      amount: 1200.5,
      currency: "USD",
    });
  });

  // ── 5. Separator ambiguity ──
  it("treats a lone separator before three digits as grouping", () => {
    // "1.200" is one thousand two hundred, not one-point-two. Three-decimal
    // menu prices do not exist; thousands separators do.
    assert.equal(parsePrice("1.200 €")?.amount, 1200);
    assert.equal(parsePrice("1,200 €")?.amount, 1200);
  });

  it("treats a lone separator before one or two digits as a decimal point", () => {
    assert.equal(parsePrice("12,50 €")?.amount, 12.5);
    assert.equal(parsePrice("12.5 €")?.amount, 12.5);
  });

  it("treats a repeated separator as grouping", () => {
    assert.equal(parsePrice("1.200.000 ₫")?.amount, 1200000);
  });

  // ── 6. Ranges resolve upward ──
  it("takes the upper bound of a range so the budget is never optimistic", () => {
    assert.deepEqual(parsePrice("8–12 €"), { amount: 12, currency: "EUR" });
    assert.deepEqual(parsePrice("8-12 €"), { amount: 12, currency: "EUR" });
    assert.equal(parsePrice("$18 / $24")?.amount, 24);
    assert.equal(parsePrice("8 to 12 EUR")?.amount, 12);
  });

  // ── 6b. Outside a range, the last number is the price ──
  //
  // Menu lines put the price at the end; the leading figures are portions or
  // quantities. Taking the maximum here was arbitrary rather than cautious,
  // and got discount strings backwards.
  it("takes the final number when the line is not a range", () => {
    assert.equal(parsePrice("Serves 2 · $18")?.amount, 18);
    assert.equal(parsePrice("2 pcs $14")?.amount, 14);
    assert.equal(parsePrice("1/2 chicken $24")?.amount, 24);
  });

  it("reads a discounted price as the current one, not the old one", () => {
    assert.equal(parsePrice("Was $30 now $20")?.amount, 20);
  });

  // ── 7. Currency hint fallback ──
  it("falls back to the hint when the string carries no symbol", () => {
    assert.deepEqual(parsePrice("980", "JPY"), { amount: 980, currency: "JPY" });
  });

  it("prefers a symbol in the string over the hint", () => {
    // The glyph on the menu beats a menu-level guess.
    assert.equal(parsePrice("€9", "USD")?.currency, "EUR");
  });

  it("returns an empty currency when neither symbol nor hint is available", () => {
    assert.deepEqual(parsePrice("980"), { amount: 980, currency: "" });
  });
});

describe("parsePrice — unparseable input returns null, never zero", () => {
  // ── 8. The failure mode that matters most ──
  //
  // A dish whose price parses as 0 looks free, so any budget-aware selection
  // picks it first. Every one of these must be null so the solver can exclude
  // the dish and tell the user, rather than silently mispricing the table.
  it("returns null for prices that cannot be read", () => {
    const unreadable = [
      "",
      "   ",
      "market price",
      "MP",
      "—",
      "-",
      "n/a",
      "ask server",
      "價格",
    ];

    for (const raw of unreadable) {
      assert.equal(parsePrice(raw), null, `"${raw}" should be unparseable`);
    }
  });

  it("returns null for undefined and null input", () => {
    assert.equal(parsePrice(undefined), null);
    assert.equal(parsePrice(null), null);
  });

  it("never returns an amount of zero for a non-zero-looking input", () => {
    for (const raw of ["market price", "—", "n/a"]) {
      const parsed = parsePrice(raw);
      assert.notEqual(parsed?.amount, 0, `"${raw}" must not parse as free`);
    }
  });
});

describe("parsePrice — determinism", () => {
  // ── 9. Same input, same output ──
  it("returns identical output for identical input", () => {
    assert.deepStrictEqual(parsePrice("1.200,50 €"), parsePrice("1.200,50 €"));
  });
});

describe("formatPrice", () => {
  // ── 10. Currency-aware rendering ──
  //
  // Delegated to Intl, which knows that yen has no minor unit and that the
  // symbol goes before the number in en-US. The locale is pinned so this does
  // not render differently on a French laptop than in CI.
  it("omits decimals for currencies that do not use them", () => {
    assert.equal(formatPrice({ amount: 980, currency: "JPY" }), "¥980");
    assert.equal(formatPrice({ amount: 12000, currency: "KRW" }), "₩12,000");
  });

  it("shows two decimals and the symbol for everything else", () => {
    assert.equal(formatPrice({ amount: 12.5, currency: "EUR" }), "€12.50");
    assert.equal(formatPrice({ amount: 10, currency: "USD" }), "$10.00");
  });

  it("omits the currency when it is unknown", () => {
    assert.equal(formatPrice({ amount: 12.5, currency: "" }), "12.50");
  });

  it("renders an unrecognised but well-formed code without crashing", () => {
    // Intl accepts any three-letter code and falls back to printing it. Note
    // it separates with U+00A0, not a plain space, so this asserts content
    // rather than exact whitespace.
    const formatted = formatPrice({ amount: 12.5, currency: "XYZ" });
    assert.match(formatted, /XYZ/);
    assert.match(formatted, /12\.50/);
  });

  it("falls back rather than throwing on a malformed currency code", () => {
    // Intl throws a RangeError on anything that is not three letters. A
    // formatter is never the right place to crash a request.
    for (const currency of ["E", "TOOLONG", "1$"]) {
      assert.doesNotThrow(() => formatPrice({ amount: 12.5, currency }));
      assert.match(formatPrice({ amount: 12.5, currency }), /12\.50/);
    }
  });
});

describe("sumPrices", () => {
  // ── 11. Totalling ──
  it("sums prices in one currency", () => {
    const total = sumPrices([
      { amount: 8, currency: "EUR" },
      { amount: 18, currency: "EUR" },
      { amount: 12, currency: "EUR" },
    ]);
    assert.deepEqual(total, { amount: 38, currency: "EUR" });
  });

  it("returns zero for an empty list", () => {
    assert.deepEqual(sumPrices([]), { amount: 0, currency: "" });
  });

  // ── 12. Floating-point discipline ──
  it("rounds to cents so budget comparisons are exact", () => {
    // 0.1 + 0.2 is 0.30000000000000004 in IEEE 754; a budget check against
    // 0.3 would fail without rounding.
    const total = sumPrices([
      { amount: 0.1, currency: "EUR" },
      { amount: 0.2, currency: "EUR" },
    ]);
    assert.equal(total.amount, 0.3);
  });

  // ── 13. Mixed currencies are an error, not a silent wrong answer ──
  it("throws rather than adding across currencies", () => {
    assert.throws(
      () =>
        sumPrices([
          { amount: 10, currency: "EUR" },
          { amount: 10, currency: "JPY" },
        ]),
      /mixed currencies/i
    );
  });
});
