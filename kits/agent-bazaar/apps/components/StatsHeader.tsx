import * as React from "react";

interface StatsHeaderProps {
  totalSettled: number;
  jobsCompleted: number;
  avgQaScore: number;
  feesBurned: number;
  epochLatency: string;
}

export function StatsHeader({
  totalSettled,
  jobsCompleted,
  avgQaScore,
  feesBurned,
  epochLatency,
}: StatsHeaderProps) {
  const stats = [
    { label: "TOTAL SETTLED", value: totalSettled, color: "text-accent" },
    { label: "JOBS COMPLETED", value: jobsCompleted, color: "text-success" },
    { label: "AVG QA SCORE", value: avgQaScore.toFixed(2), color: "text-warning" },
    { label: "FEES BURNED", value: `$${feesBurned}`, color: "text-error" },
    { label: "EPOCH LATENCY", value: epochLatency, color: "text-muted-alt" },
  ];

  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg font-semibold text-[var(--primary)]">AB</span>
        <span className="text-sm font-medium text-[var(--text-primary)]">Agent Bazaar</span>
        <span className="rounded bg-[var(--bg-surface-container)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
          v1.0.0
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--secondary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary)]" />
          testnet
        </span>
      </div>
      <div className="flex items-center gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-end">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {stat.label}
            </span>
            <span className={`font-mono text-sm font-medium ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
