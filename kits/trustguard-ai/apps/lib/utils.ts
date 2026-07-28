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
  if (!Number.isFinite(score)) return "text-[var(--tg-neutral)]";
  if (score >= 80) return "text-[var(--tg-red)]";
  if (score >= 60) return "text-[var(--tg-orange)]";
  if (score >= 40) return "text-[var(--tg-yellow)]";
  return "text-[var(--tg-green)]";
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
      return { text: "text-[var(--tg-red)]", bg: "bg-[var(--tg-red-bg)]", border: "border-[var(--tg-red-border)]" };
    case "HIGH":
      return { text: "text-[var(--tg-red)]", bg: "bg-[var(--tg-red-bg)]", border: "border-[var(--tg-red-border)]" };
    case "MEDIUM":
      return { text: "text-[var(--tg-orange)]", bg: "bg-[var(--tg-orange-bg)]", border: "border-[var(--tg-orange-border)]" };
    case "LOW":
      return { text: "text-[var(--tg-green)]", bg: "bg-[var(--tg-green-bg)]", border: "border-[var(--tg-green-border)]" };
    default:
      return { text: "text-[var(--tg-neutral)]", bg: "bg-[var(--tg-neutral-bg)]", border: "border-[var(--tg-neutral-border)]" };
  }
}

/**
 * Returns Tailwind CSS colour classes for a decision classification badge.
 *
 * Keyword matching (case-insensitive):
 * - `"SCAM"`, `"FRAUD"`, `"MALICIOUS"`, `"PHISHING"`, `"MALWARE"`, `"CREDENTIAL_THEFT"`, or `"BUSINESS_EMAIL_COMPROMISE"` → red palette
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
  if (
    upper.includes("SCAM") ||
    upper.includes("FRAUD") ||
    upper.includes("MALICIOUS") ||
    upper.includes("PHISHING") ||
    upper.includes("MALWARE") ||
    upper.includes("CREDENTIAL_THEFT") ||
    upper.includes("BUSINESS_EMAIL_COMPROMISE")
  ) {
    return {
      text: "text-[var(--tg-red)]",
      bg: "bg-[var(--tg-red-bg)]",
      border: "border-[var(--tg-red-border)]",
      glow: "shadow-[var(--tg-red-glow)]",
    };
  }
  if (upper.includes("SUSPICIOUS") || upper.includes("UNCERTAIN")) {
    return {
      text: "text-[var(--tg-orange)]",
      bg: "bg-[var(--tg-orange-bg)]",
      border: "border-[var(--tg-orange-border)]",
      glow: "shadow-[var(--tg-orange-glow)]",
    };
  }
  if (upper.includes("SAFE") || upper.includes("LEGITIMATE") || upper.includes("CLEAN")) {
    return {
      text: "text-[var(--tg-green)]",
      bg: "bg-[var(--tg-green-bg)]",
      border: "border-[var(--tg-green-border)]",
      glow: "shadow-[var(--tg-green-glow)]",
    };
  }
  return {
    text: "text-[var(--tg-cyan)]",
    bg: "bg-[var(--tg-cyan-bg)]",
    border: "border-[var(--tg-cyan-border)]",
    glow: "shadow-[var(--tg-cyan-glow)]",
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
      return "bg-[var(--tg-red-bg)] text-[var(--tg-red)] border border-[var(--tg-red-border)]";
    case "medium":
      return "bg-[var(--tg-orange-bg)] text-[var(--tg-orange)] border border-[var(--tg-orange-border)]";
    case "low":
      return "bg-[var(--tg-green-bg)] text-[var(--tg-green)] border border-[var(--tg-green-border)]";
    default:
      return "bg-[var(--tg-neutral-bg)] text-[var(--tg-neutral)] border border-[var(--tg-neutral-border)]";
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
