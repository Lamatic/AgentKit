// price.ts — parsing printed menu prices into comparable numbers.
//
// This module exists because budget is a hard constraint in Orderly, not a
// decoration. A misparsed price is not a cosmetic bug: it either blows the
// diner's budget or silently drops an affordable dish. Two rules follow from
// that:
//
//   1. When a price cannot be parsed, return `null`. Never fall back to 0.
//      A dish that appears free will be picked first by any budget-aware
//      selection, which is the worst possible failure mode.
//   2. When a price is a range ("8–12"), take the upper bound. Overestimating
//      the bill is recoverable; underestimating it is what leaves someone
//      short at the till. Outside a range the last number wins, because menu
//      lines put the price at the end and the leading figures are portions
//      ("Serves 2 · $18").

import type { ParsedPrice } from "./types";

// ---------------------------------------------------------------------------
// Currency detection
// ---------------------------------------------------------------------------

/**
 * Currency symbols and their ISO 4217 codes.
 *
 * Several symbols are genuinely ambiguous across countries — `$` is used by
 * the US, Canada, Australia and others; `¥` by both Japan and China. We resolve
 * to the most common interpretation and let the caller override with an
 * explicit hint from the flow's `detectedLanguage` / `currency` output, which
 * is derived from the menu itself and is better evidence than the glyph.
 *
 * Longer symbols are tested first so `R$` wins over `$`.
 */
const SYMBOL_TO_CURRENCY: Readonly<Record<string, string>> = {
  R$: "BRL",
  CHF: "CHF",
  kr: "SEK",
  zł: "PLN",
  Kč: "CZK",
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "₩": "KRW",
  "₽": "RUB",
  "₺": "TRY",
  "฿": "THB",
  "₫": "VND",
  "₪": "ILS",
};

/** ISO 4217 codes we accept when written out literally, e.g. "980 JPY". */
const ISO_CODES = new Set([
  "USD", "EUR", "GBP", "JPY", "INR", "KRW", "CNY", "AUD", "CAD", "CHF",
  "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "TRY", "THB", "VND", "ILS",
  "BRL", "MXN", "ZAR", "SGD", "HKD", "NZD", "RUB", "AED", "SAR", "IDR",
  "MYR", "PHP", "TWD",
]);

/**
 * Identifies the currency of a price string.
 *
 * Checks written ISO codes first (unambiguous), then symbols longest-first.
 * Returns `null` when nothing is recognised — the caller falls back to a hint.
 */
export function detectCurrency(raw: string): string | null {
  const upper = raw.toUpperCase();
  for (const code of ISO_CODES) {
    // Bounded by a string edge or a non-letter, rather than by \b. A word
    // boundary sits between a letter and a digit, so `\bJPY\b` fails on
    // "980JPY" — a spelling menus and OCR both produce. Requiring a non-letter
    // neighbour still refuses to find "USD" inside a longer word.
    if (new RegExp(`(?<![A-Z])${code}(?![A-Z])`).test(upper)) return code;
  }

  const symbols = Object.keys(SYMBOL_TO_CURRENCY).sort(
    (a, b) => b.length - a.length
  );
  for (const symbol of symbols) {
    if (raw.includes(symbol)) return SYMBOL_TO_CURRENCY[symbol];
  }

  return null;
}

// ---------------------------------------------------------------------------
// Number parsing
// ---------------------------------------------------------------------------

/**
 * Interprets a numeric token that may use either European (`1.200,50`) or
 * Anglo (`1,200.50`) grouping.
 *
 * The rules, in order:
 *
 *  1. **Both separators present** — the *rightmost* is the decimal separator.
 *     `1.200,50` → 1200.50 · `1,200.50` → 1200.50
 *  2. **One separator, appearing more than once** — it is a group separator.
 *     `1.200.000` → 1000000
 *  3. **One separator, followed by exactly three digits** — ambiguous in
 *     principle (`1.200` could be one-point-two). Treated as a group
 *     separator, because three-digit groups are overwhelmingly thousands and
 *     because three-decimal-place menu prices essentially do not exist.
 *     `1.200` → 1200 · `1,200` → 1200
 *  4. **One separator, followed by one or two digits** — a decimal separator.
 *     `12,50` → 12.50 · `12.5` → 12.5
 *
 * Returns `null` for anything that is not a well-formed number.
 */
function parseNumericToken(token: string): number | null {
  const cleaned = token.replace(/\s/g, "");
  if (!/^\d[\d.,]*$/.test(cleaned)) return null;

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  let normalized: string;

  if (lastDot !== -1 && lastComma !== -1) {
    // Rule 1 — rightmost separator is the decimal point.
    const decimalIndex = Math.max(lastDot, lastComma);
    const integerPart = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
    const fractionPart = cleaned.slice(decimalIndex + 1);
    normalized = `${integerPart}.${fractionPart}`;
  } else if (lastDot === -1 && lastComma === -1) {
    normalized = cleaned;
  } else {
    const separator = lastDot !== -1 ? "." : ",";
    const occurrences = cleaned.split(separator).length - 1;
    const trailing = cleaned.slice(cleaned.lastIndexOf(separator) + 1);

    if (occurrences > 1 || trailing.length === 3) {
      // Rules 2 and 3 — grouping.
      normalized = cleaned.split(separator).join("");
    } else {
      // Rule 4 — decimal.
      normalized = cleaned.replace(separator, ".");
    }
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Matches every numeric run in a string, including grouped and decimal forms. */
const NUMBER_PATTERN = /\d[\d.,]*/g;

/**
 * Detects two numbers joined by a range separator, e.g. "8-12", "18 / 24",
 * "8 to 12". A few non-digit characters are tolerated after the separator so a
 * repeated currency symbol ("$18 / $24") still reads as one range.
 */
const RANGE_JOIN = /\d[\d.,]*\s*(?:[-–—/]|\bto\b)\s*[^\d\s]{0,3}\s*\d/;

/**
 * Parses a printed price into a comparable amount and currency.
 *
 * Returns `null` when no number can be found — "market price", "MP", "—", an
 * empty string. Callers **must** handle `null` by excluding the dish from
 * budget arithmetic and telling the user, rather than substituting a value.
 *
 * When the string holds a range, the **upper** bound is returned, so the
 * budget is never optimistic.
 *
 * @param raw - The price exactly as printed, e.g. `"¥980"`, `"1.200,50 €"`.
 * @param currencyHint - ISO code from the flow's menu-level currency detection,
 *   used when the price string itself carries no symbol.
 */
export function parsePrice(
  raw: string | undefined | null,
  currencyHint?: string
): ParsedPrice | null {
  if (raw === undefined || raw === null) return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const tokens = trimmed.match(NUMBER_PATTERN);
  if (tokens === null || tokens.length === 0) return null;

  const values = tokens
    .map(parseNumericToken)
    .filter((value): value is number => value !== null);

  if (values.length === 0) return null;

  // A genuine range ("8-12", "18 / 24", "8 to 12") resolves to its upper bound,
  // because the dish really can cost the higher figure and a budget must assume
  // it will. Anywhere else, the last number is the price: menu lines put the
  // price at the end and the leading figures are quantities or portions
  // ("Serves 2 · $18", "2 pcs $14"). Taking the maximum there was arbitrary
  // rather than cautious, and got "Was $30, now $20" wrong.
  const amount = RANGE_JOIN.test(trimmed)
    ? Math.max(...values)
    : values[values.length - 1];

  if (!Number.isFinite(amount) || amount < 0) return null;

  const currency = detectCurrency(trimmed) ?? currencyHint?.toUpperCase() ?? "";

  return { amount, currency };
}

/**
 * Renders a price for display.
 *
 * Zero-decimal currencies (JPY, KRW, VND) are shown without a fractional part,
 * since "¥980.00" is not how anyone writes yen.
 */
export function formatPrice(price: ParsedPrice): string {
  if (price.currency === "") return price.amount.toFixed(2);

  try {
    // The locale is pinned rather than left to the host. An unpinned
    // Intl.NumberFormat renders differently on a French laptop than in CI,
    // which would make every assertion about this output environment-dependent.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency,
    }).format(price.amount);
  } catch {
    // Intl throws on a currency code it does not recognise. A menu can carry
    // one; a crash in a formatter is never the right answer to that.
    return `${price.amount.toFixed(2)} ${price.currency}`;
  }
}

/**
 * Sums prices that share a currency.
 *
 * Throws on a currency mismatch rather than silently adding incompatible
 * numbers — a bill totalled across two currencies is meaningless, and the
 * solver relies on this total to enforce the budget ceiling.
 */
export function sumPrices(prices: readonly ParsedPrice[]): ParsedPrice {
  if (prices.length === 0) return { amount: 0, currency: "" };

  const currencies = new Set(prices.map((p) => p.currency).filter((c) => c !== ""));
  if (currencies.size > 1) {
    throw new Error(
      `Cannot total prices in mixed currencies: ${[...currencies].join(", ")}`
    );
  }

  const amount = prices.reduce((total, price) => total + price.amount, 0);
  // Rounded to cents to keep floating-point drift out of budget comparisons.
  return {
    amount: Math.round(amount * 100) / 100,
    currency: [...currencies][0] ?? "",
  };
}
