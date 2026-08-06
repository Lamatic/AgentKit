import { OctagonAlert, TriangleAlert, CircleAlert, Info, Minus } from "lucide-react";
import type { Severity } from "./types";

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export const SEVERITY_ICON: Record<Severity, typeof Info> = {
  critical: OctagonAlert,
  high: TriangleAlert,
  medium: CircleAlert,
  low: Info,
  info: Minus,
};

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function normalizeSeverity(s: string): Severity {
  const v = (s || "").toLowerCase();
  return (["critical", "high", "medium", "low", "info"] as string[]).includes(v)
    ? (v as Severity)
    : "info";
}

/** Ring/grade color from the score band. */
export function bandColor(score: number): string {
  if (score >= 90) return "var(--band-a)";
  if (score >= 80) return "var(--band-b)";
  if (score >= 70) return "var(--band-c)";
  if (score >= 60) return "var(--band-d)";
  return "var(--band-f)";
}
