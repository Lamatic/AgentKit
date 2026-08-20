import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate log content to the last N lines before sending to Lamatic.
 * CI failures almost always appear at the tail of a log.
 */
export function truncateLog(log: string, maxLines = 8_000): string {
  const lines = log.split("\n");
  if (lines.length <= maxLines) return log;
  return lines.slice(lines.length - maxLines).join("\n");
}

/**
 * Format a confidence score (0–1) as a human-readable percentage.
 */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Map a risk level string to a Tailwind CSS colour token.
 */
export function riskToColor(level: string): string {
  switch (level) {
    case "Low":
      return "text-emerald-400";
    case "Medium":
      return "text-amber-400";
    case "High":
      return "text-rose-400";
    default:
      return "text-zinc-400";
  }
}

/**
 * Map a risk level string to a badge background token.
 */
export function riskToBadgeBg(level: string): string {
  switch (level) {
    case "Low":
      return "bg-emerald-900/50 text-emerald-300 border-emerald-700";
    case "Medium":
      return "bg-amber-900/50 text-amber-300 border-amber-700";
    case "High":
      return "bg-rose-900/50 text-rose-300 border-rose-700";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-600";
  }
}
