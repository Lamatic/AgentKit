"use client";

import type { DiagnosisHistoryItem } from "@/lib/types";

interface DashboardCompareModalProps {
  items: [DiagnosisHistoryItem, DiagnosisHistoryItem];
  onClose: () => void;
}

export function DashboardCompareModal({ items, onClose }: DashboardCompareModalProps) {
  const [itemA, itemB] = items;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-5xl rounded-[24px] p-6 space-y-6 border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Side-by-Side Failure Comparison
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Comparing #{itemA.runNumber} ({itemA.repoName}) vs #{itemB.runNumber} ({itemB.repoName})
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-lg text-[var(--muted)] hover:text-white transition-all"
          >
            ×
          </button>
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column A */}
          <div className="space-y-4 rounded-[18px] border border-white/10 bg-black/40 p-5">
            <div className="pb-3 border-b border-white/10">
              <span className="text-xs font-mono text-cyan-400">Diagnosis A (Run #{itemA.runNumber})</span>
              <h4 className="font-semibold text-white text-sm mt-1">{itemA.repoOwner}/{itemA.repoName}</h4>
              <p className="text-xs text-[var(--muted)]">Branch: {itemA.branch} ({itemA.commitSha})</p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Category & Risk</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-medium">
                  {itemA.diagnosis.classification.category}
                </span>
                <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-xs font-medium">
                  Risk: {itemA.diagnosis.risk.level}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Root Cause Summary</span>
              <p className="text-xs font-semibold text-white leading-relaxed">
                {itemA.diagnosis.analysis.root_cause_summary}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Verified Code Fix</span>
              <pre className="rounded-[10px] bg-black/60 p-2.5 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                <code>{itemA.diagnosis.resolution.fixes[0]?.code || "No code snippet"}</code>
              </pre>
            </div>
          </div>

          {/* Column B */}
          <div className="space-y-4 rounded-[18px] border border-white/10 bg-black/40 p-5">
            <div className="pb-3 border-b border-white/10">
              <span className="text-xs font-mono text-cyan-400">Diagnosis B (Run #{itemB.runNumber})</span>
              <h4 className="font-semibold text-white text-sm mt-1">{itemB.repoOwner}/{itemB.repoName}</h4>
              <p className="text-xs text-[var(--muted)]">Branch: {itemB.branch} ({itemB.commitSha})</p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Category & Risk</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-medium">
                  {itemB.diagnosis.classification.category}
                </span>
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium">
                  Risk: {itemB.diagnosis.risk.level}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Root Cause Summary</span>
              <p className="text-xs font-semibold text-white leading-relaxed">
                {itemB.diagnosis.analysis.root_cause_summary}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Verified Code Fix</span>
              <pre className="rounded-[10px] bg-black/60 p-2.5 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                <code>{itemB.diagnosis.resolution.fixes[0]?.code || "No code snippet"}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="apple-button rounded-[14px] px-5 py-2 text-xs font-semibold shadow-md"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
