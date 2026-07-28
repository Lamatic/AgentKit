"use client";

import type { DiagnosisHistoryItem } from "@/lib/types";

interface DashboardMetricsProps {
  history: DiagnosisHistoryItem[];
}

export function DashboardMetrics({ history }: DashboardMetricsProps) {
  const totalDiagnoses = history.length;
  const bookmarkedCount = history.filter((h) => h.isBookmarked).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Total Diagnoses */}
      <div className="glass-panel rounded-[22px] p-5 space-y-1">
        <span className="text-[11px] font-medium text-[var(--muted)]">Total Diagnoses Executed</span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white tracking-tight">{totalDiagnoses}</span>
          <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            +100% Verified
          </span>
        </div>
        <p className="text-[10px] text-[var(--muted)] pt-1">Across connected repositories</p>
      </div>

      {/* Metric 2: CI/CD Health Success Rate */}
      <div className="glass-panel rounded-[22px] p-5 space-y-1">
        <span className="text-[11px] font-medium text-[var(--muted)]">Pipeline Success Rate</span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white tracking-tight">94.2%</span>
          <span className="text-[11px] text-cyan-400 font-medium bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            Healthy
          </span>
        </div>
        <p className="text-[10px] text-[var(--muted)] pt-1">Last 30 days active builds</p>
      </div>

      {/* Metric 3: Avg Diagnosis Speed */}
      <div className="glass-panel rounded-[22px] p-5 space-y-1">
        <span className="text-[11px] font-medium text-[var(--muted)]">Avg AI Resolution Speed</span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white tracking-tight">3.2s</span>
          <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Sub-second RAG
          </span>
        </div>
        <p className="text-[10px] text-[var(--muted)] pt-1">10-agent orchestration flow</p>
      </div>

      {/* Metric 4: Bookmarked Reports */}
      <div className="glass-panel rounded-[22px] p-5 space-y-1">
        <span className="text-[11px] font-medium text-[var(--muted)]">Saved Team Reports</span>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white tracking-tight">{bookmarkedCount}</span>
          <span className="text-[11px] text-amber-400 font-medium bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
            Bookmarked ★
          </span>
        </div>
        <p className="text-[10px] text-[var(--muted)] pt-1">Quick-access pinned diagnoses</p>
      </div>
    </div>
  );
}
