/**
 * Spreadsheet-safe CSV value helpers.
 *
 * Two concerns are handled separately:
 *  - Structural CSV escaping (comma/quote/newline safety) via quote wrapping.
 *  - Formula-injection protection: values that a spreadsheet would interpret
 *    as a formula (=, +, -, @, ...) are neutralized by prefixing a single
 *    quote, even when leading whitespace/tabs/CR precede the prefix.
 */

const FORMULA_PREFIXES = ["=", "+", "-", "@"];

/**
 * Finds the first character that is not leading whitespace/control filler.
 * Spreadsheet apps often ignore leading whitespace when deciding whether a
 * cell starts a formula, so a value like " =1+1" is just as dangerous as "=1+1".
 */
function firstMeaningfulChar(value: string): string | null {
  for (const ch of value) {
    if (ch !== " " && ch !== "\t" && ch !== "\r") return ch;
  }
  return null;
}

/**
 * Neutralizes spreadsheet formula prefixes on a value, returning the string
 * form. Null/undefined are left untouched by this layer (CSV serialization
 * decides how to render them). Dangerous values are prefixed once with a
 * single quote; safe values are returned unchanged.
 */
export function makeSpreadsheetSafe(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.length === 0) return str;
  const first = firstMeaningfulChar(str);
  if (first !== null && FORMULA_PREFIXES.includes(first)) {
    return "'" + str;
  }
  return str;
}

/**
 * Serializes a value into a CSV cell: null/undefined become an empty field,
 * everything else is quote-wrapped with embedded double quotes escaped
 * ("" -> """) and formula-safe. This preserves the original exporter's
 * behavior while adding spreadsheet-formula protection.
 */
export function csvEscapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const safe = makeSpreadsheetSafe(value);
  return '"' + safe.replace(/"/g, '""') + '"';
}
