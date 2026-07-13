// lib/utils.ts
// Utility helpers for colors, formatting, and display logic

/**
 * Returns a Tailwind CSS text color class based on risk score (0-100)
 */
export function getRiskColor(score: number): string {
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-orange-400";
  if (score >= 40) return "text-yellow-400";
  return "text-green-400";
}

/**
 * Returns a Tailwind CSS text + border color class based on severity string
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
 * Returns colors for the decision classification badge
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
 * Returns badge color styles for indicator level chips
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
 * Clamp a number between min and max
 */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Format a percentage value with bounds checking
 */
export function formatPercent(value: number): string {
  return `${Math.round(clamp(value))}%`;
}
