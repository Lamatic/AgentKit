// components/ThreatCard.tsx
"use client";

import { motion } from "framer-motion";
import RiskMeter from "@/components/RiskMeter";
import { getSeverityColor, getIndicatorLevelColor, formatPercent, clamp } from "@/lib/utils";
import type { ThreatAnalysis } from "@/types/response";

interface ThreatCardProps {
  analysis: ThreatAnalysis;
  delay?: number;
}

export default function ThreatCard({ analysis, delay = 0 }: ThreatCardProps) {
  const severityColors = getSeverityColor(analysis.severity);
  const riskScore = Math.round(clamp(analysis.risk_score * (analysis.risk_score > 1 ? 1 : 100)));
  const confidenceScore = Math.round(clamp(analysis.confidence * (analysis.confidence > 1 ? 1 : 100)));

  // Normalise 0-1 to 0-100 if the API returns decimals
  const normalise = (v: number) => (v <= 1 ? Math.round(v * 100) : Math.round(clamp(v)));

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 shadow-xl h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
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
    </motion.div>
  );
}
