"use client";

import { useMemo } from "react";
import type { DiagnosisHistoryItem } from "@/lib/types";

interface DashboardAnalyticsProps {
  history: DiagnosisHistoryItem[];
}

export function DashboardAnalytics({ history }: DashboardAnalyticsProps) {
  // Compute top failure categories dynamically
  const sortedCategories = useMemo(() => {
    const categoryCounts = history.reduce<Record<string, number>>((acc, item) => {
      const cat = item.diagnosis.classification.category || "General Error";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  }, [history]);

  // Dynamically group repository health metrics from real history items
  const repoHealthList = useMemo(() => {
    const map = new Map<string, { repo: string; failureCount: number; topError: string; lastTimestamp: string }>();

    history.forEach((item) => {
      const fullName = `${item.repoOwner}/${item.repoName}`;
      const existing = map.get(fullName);
      if (!existing) {
        map.set(fullName, {
          repo: fullName,
          failureCount: 1,
          topError: item.diagnosis.analysis.root_cause_summary,
          lastTimestamp: item.timestamp,
        });
      } else {
        existing.failureCount += 1;
      }
    });

    return Array.from(map.values());
  }, [history]);

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffMins = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Primary Failure Loci & Categories */}
      <div className="glass-panel rounded-[24px] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Primary Failure Loci & Categories
          </h3>
          <span className="text-[10px] text-cyan-400">AI Classification</span>
        </div>

        <div className="space-y-3">
          {sortedCategories.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted)]">
              No failure categories recorded yet. Run your first diagnosis to generate failure loci charts.
            </div>
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
          <span className="text-[10px] text-emerald-400">Live Monitored</span>
        </div>

        <div className="space-y-3">
          {repoHealthList.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted)] border border-dashed border-white/10 rounded-[16px]">
              No repository incidents recorded yet. Connect a repository or diagnose a log to start tracking health.
            </div>
          ) : (
            repoHealthList.map((item, idx) => {
              const status = item.failureCount > 2 ? "Needs Review" : "Active";
              const statusColor = item.failureCount > 2 ? "amber" : "emerald";
              return (
                <div key={idx} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{item.repo}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          statusColor === "emerald"
                            ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                            : "border-amber-500/30 bg-amber-950/40 text-amber-400"
                        }`}
                      >
                        {status} ({item.failureCount} Incidents)
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mt-1 truncate max-w-xs" title={item.topError}>
                      Latest Error: {item.topError}
                    </p>
                  </div>

                  <span className="text-[10px] text-[var(--muted)] whitespace-nowrap ml-2">
                    {formatRelativeTime(item.lastTimestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
