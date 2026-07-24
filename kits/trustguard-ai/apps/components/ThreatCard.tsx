// components/ThreatCard.tsx
"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import RiskMeter from "@/components/RiskMeter";
import { getSeverityColor, getIndicatorLevelColor, formatPercent, clamp } from "@/lib/utils";
import type { ThreatAnalysis } from "@/types/response";

interface ThreatCardProps {
  readonly analysis: ThreatAnalysis;
}

/**
 * Result card that presents the complete threat analysis from the Lamatic flow.
 *
 * Renders a risk gauge via `RiskMeter`, a confidence percentage, a severity
 * badge, a grouped list of high/medium/low threat indicator chips, and the
 * AI reasoning summary.  All numeric values are normalised to 0–100 before
 * display in case the API returns 0–1 decimals.
 *
 * @param analysis - Validated threat analysis data returned by the Lamatic flow.
 * @param delay    - Framer Motion entry delay in seconds (default `0`).
 * @returns An animated card element with the full threat analysis breakdown.
 */
export default function ThreatCard({ analysis }: ThreatCardProps) {
  const severityColors = getSeverityColor(analysis.severity);

  // Normalise 0-1 to 0-100 if the API returns decimals
  /**
   * Converts a numeric score to a whole-number percentage.
   *
   * Treats values in the 0–1 range as fractions and multiplies by 100;
   * treats values already above 1 as percentage points and clamps them to
   * the 0–100 range before rounding.
   *
   * @param v - Raw numeric value from the Lamatic response.
   * @returns Integer percentage in the 0–100 range.
   */
  const normalise = (v: number) => Math.round(clamp(v >= 0 && v <= 1 ? v * 100 : v));

  return (
    <div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 shadow-xl h-full"
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-white">Threat Analysis</h3>
      </div>

      {/* Risk Meters Row */}
      <div className="flex items-end justify-around mb-5 gap-4">
        <RiskMeter value={normalise(analysis.risk_score)} label="Risk" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-slate-200">
            {formatPercent(normalise(analysis.confidence))}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
            Confidence
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold border ${severityColors.bg} ${severityColors.text} ${severityColors.border}`}
          >
            {analysis.severity?.toUpperCase() ?? "—"}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
            Severity
          </span>
        </div>
      </div>

      {/* Indicators */}
      <div className="space-y-3">
        {(["high", "medium", "low"] as const).map((level) => {
          const items = analysis.indicators?.[level] ?? [];
          if (items.length === 0) return null;
          return (
            <div key={level}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${level === "high" ? "text-red-400" : level === "medium" ? "text-orange-400" : "text-green-400"}`}>
                {level} risk indicators
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getIndicatorLevelColor(level)}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reasoning summary */}
      {analysis.reasoning_summary && (
        <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Reasoning
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.reasoning_summary}
          </p>
        </div>
      )}
    </div>
  );
}
