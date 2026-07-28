"use client";

import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  latencyMs: number;
  environment: string;
  version: string;
  checks: {
    githubRestApi: string;
    lamaticAiEngine: string;
    memoryUsageMb: number;
  };
}

interface SystemHealthModalProps {
  onClose: () => void;
}

export function SystemHealthModal({ onClose }: SystemHealthModalProps) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-[24px] p-6 space-y-5 border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 pulse-glow" />
            <h3 className="text-base font-bold text-white">System & Service Health Status</h3>
          </div>

          <button
            onClick={onClose}
            className="text-lg text-[var(--muted)] hover:text-white transition-all"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--muted)]">Probing live services...</div>
        ) : !data ? (
          <div className="py-8 text-center text-xs text-rose-300">Failed to connect to health probe.</div>
        ) : (
          <div className="space-y-4">
            {/* Status Overview Banner */}
            <div className="rounded-[16px] border border-emerald-500/30 bg-emerald-950/30 p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[var(--muted)]">Overall System Status</span>
                <p className="text-sm font-bold text-emerald-400 capitalize">{data.status} (100% Operational)</p>
              </div>
              <span className="font-mono text-xs text-white/80 bg-white/10 px-2.5 py-1 rounded-full">
                {data.latencyMs}ms Probe
              </span>
            </div>

            {/* Individual Health Probes */}
            <div className="space-y-2.5">
              {/* Probe 1: GitHub API */}
              <div className="rounded-[14px] border border-white/10 bg-white/5 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white">GitHub REST API</span>
                  <p className="text-[11px] text-[var(--muted)]">api.github.com workflow run endpoint</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 capitalize">
                  {data.checks.githubRestApi}
                </span>
              </div>

              {/* Probe 2: Lamatic AI Engine */}
              <div className="rounded-[14px] border border-white/10 bg-white/5 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white">Lamatic AgentKit Pipeline</span>
                  <p className="text-[11px] text-[var(--muted)]">10-Node cloud workflow endpoint</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 capitalize">
                  {data.checks.lamaticAiEngine}
                </span>
              </div>

              {/* Probe 3: Host Memory & Uptime */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-[14px] border border-white/10 bg-white/5 p-3">
                  <span className="text-[10px] text-[var(--muted)]">Node Heap Used</span>
                  <p className="text-xs font-mono text-white font-bold">{data.checks.memoryUsageMb} MB</p>
                </div>
                <div className="rounded-[14px] border border-white/10 bg-white/5 p-3">
                  <span className="text-[10px] text-[var(--muted)]">System Uptime</span>
                  <p className="text-xs font-mono text-white font-bold">{data.uptimeSeconds}s</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="apple-button rounded-[14px] px-5 py-2 text-xs font-semibold shadow-md"
          >
            Close Monitor
          </button>
        </div>
      </div>
    </div>
  );
}
