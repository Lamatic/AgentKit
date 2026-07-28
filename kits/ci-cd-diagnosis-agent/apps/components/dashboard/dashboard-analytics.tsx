"use client";

import type { DiagnosisHistoryItem } from "@/lib/types";

interface DashboardAnalyticsProps {
  history: DiagnosisHistoryItem[];
}

export function DashboardAnalytics({ history }: DashboardAnalyticsProps) {
  // Compute top failure categories
  const categoryCounts = history.reduce<Record<string, number>>((acc, item) => {
    const cat = item.diagnosis.classification.category || "Unknown";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Top Failure Categories */}
      <div className="glass-panel rounded-[24px] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Primary Failure Loci & Categories
          </h3>
          <span className="text-[10px] text-cyan-400">AI Classification</span>
        </div>

        <div className="space-y-3">
          {sortedCategories.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No category data recorded yet.</p>
          ) : (
            sortedCategories.map(([category, count]) => {
              const percentage = Math.round((count / Math.max(1, history.length)) * 100);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-white">{category}</span>
                    <span className="text-[var(--muted)]">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Repository Health Matrix */}
      <div className="glass-panel rounded-[24px] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Repository Health & Incident Status
          </h3>
          <span className="text-[10px] text-emerald-400">Monitored</span>
        </div>

        <div className="space-y-3">
          {[
            {
              repo: "pawanchhimwal/AgentKit",
              status: "Needs Attention",
              statusColor: "amber",
              topError: "JavaScript OOM (Exit Code 137)",
              lastFailure: "35m ago",
            },
            {
              repo: "octocat/my-app",
              status: "Healthy",
              statusColor: "emerald",
              topError: "Peer Dependency Conflict",
              lastFailure: "3h ago",
            },
          ].map((item, idx) => (
            <div key={idx} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-xs">{item.repo}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                      item.statusColor === "emerald"
                        ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                        : "border-amber-500/30 bg-amber-950/40 text-amber-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1">Top Error: {item.topError}</p>
              </div>

              <span className="text-[10px] text-[var(--muted)]">{item.lastFailure}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
