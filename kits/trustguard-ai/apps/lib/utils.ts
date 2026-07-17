// lib/utils.ts
// Utility helpers for colors, formatting, and display logic

/**
 * Returns a Tailwind CSS text color class based on risk score (0–100).
 *
 * Thresholds: ≥80 → red, ≥60 → orange, ≥40 → yellow, <40 → green.
 * Invalid scores (NaN) fall back to a neutral slate color instead of
 * being silently classified as safe/green.
 *
 * @param score - Numeric risk score in the 0–100 range.
 * @returns A Tailwind `text-*` color class string.
 */
export function getRiskColor(score: number): string {
  if (!Number.isFinite(score)) return "text-slate-400";
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-orange-400";
  if (score >= 40) return "text-yellow-400";
  return "text-green-400";
}

/**
 * Returns Tailwind CSS colour classes for a severity badge based on the
 * severity string returned by the Lamatic threat analyser stage.
 *
 * Recognised values (case-insensitive): `"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, `"LOW"`.
 * Any unrecognised value falls back to a neutral slate palette.
 *
 * @param severity - Raw severity string from the API response.
 * @returns An object with `text`, `bg`, and `border` Tailwind class strings.
 */
export function getSeverityColor(severity: string): {
  text: string;
  bg: string;
  border: string;
} {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return { text: "text-red-300", bg: "bg-red-500/20", border: "border-red-500/40" };
    case "HIGH":
      return { text: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" };
    case "MEDIUM":
      return { text: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" };
    case "LOW":
      return { text: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/30" };
    default:
      return { text: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30" };
  }
}

/**
 * Returns Tailwind CSS colour classes for a decision classification badge.
 *
 * Keyword matching (case-insensitive):
 * - `"SCAM"`, `"FRAUD"`, or `"MALICIOUS"` → red palette
 * - `"SUSPICIOUS"` or `"UNCERTAIN"` → orange palette
 * - `"SAFE"`, `"LEGITIMATE"`, or `"CLEAN"` → green palette
 * - Anything else → cyan palette
 *
 * @param classification - Raw classification string from the API response.
 * @returns An object with `text`, `bg`, `border`, and `glow` Tailwind class strings.
 */
export function getDecisionColor(classification: string): {
  text: string;
  bg: string;
  border: string;
  glow: string;
} {
  const upper = classification?.toUpperCase() ?? "";
  if (upper.includes("SCAM") || upper.includes("FRAUD") || upper.includes("MALICIOUS")) {
    return {
      text: "text-red-300",
      bg: "bg-red-500/20",
      border: "border-red-400/50",
      glow: "shadow-red-500/20",
    };
  }
  if (upper.includes("SUSPICIOUS") || upper.includes("UNCERTAIN")) {
    return {
      text: "text-orange-300",
      bg: "bg-orange-500/20",
      border: "border-orange-400/50",
      glow: "shadow-orange-500/20",
    };
  }
  if (upper.includes("SAFE") || upper.includes("LEGITIMATE") || upper.includes("CLEAN")) {
    return {
      text: "text-green-300",
      bg: "bg-green-500/20",
      border: "border-green-400/50",
      glow: "shadow-green-500/20",
    };
  }
  return {
    text: "text-cyan-300",
    bg: "bg-cyan-500/20",
    border: "border-cyan-400/50",
    glow: "shadow-cyan-500/20",
  };
}

/**
 * Returns Tailwind CSS class string for an indicator-level chip.
 *
 * Maps `"high"` → red, `"medium"` → orange, and `"low"` → green badge styles.
 *
 * @param level - Indicator severity level: `"high"`, `"medium"`, or `"low"`.
 * @returns A Tailwind class string combining background, text, and border colours.
 */
export function getIndicatorLevelColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "bg-red-500/20 text-red-300 border border-red-500/40";
    case "medium":
      return "bg-orange-500/20 text-orange-300 border border-orange-500/40";
    case "low":
      return "bg-green-500/20 text-green-300 border border-green-500/40";
  }
}

/**
 * Clamps a number to the inclusive [min, max] range.
 *
 * @param value - The number to clamp.
 * @param min   - Lower bound (default `0`).
 * @param max   - Upper bound (default `100`).
 * @returns The clamped value: `min` if `value < min`, `max` if `value > max`,
 *   otherwise `value` unchanged.
 */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Formats a numeric value as a percentage string, clamped to 0–100.
 *
 * Delegates to `clamp()` before rounding so out-of-range values from the
 * API never produce strings like `"-5%"` or `"110%"`.
 *
 * @param value - Numeric value to format (expected range: 0–100).
 * @returns A string in the form `"N%"` where N is an integer in 0–100.
 */
export function formatPercent(value: number): string {
  return `${Math.round(clamp(value))}%`;
}
