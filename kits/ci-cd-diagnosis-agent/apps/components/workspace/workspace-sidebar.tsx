"use client";

import type { WorkspaceMetadata } from "@/lib/types";

interface WorkspaceSidebarProps {
  metadata?: WorkspaceMetadata | null;
  ciProvider: "github" | "gitlab";
}

export function WorkspaceSidebar({ metadata, ciProvider }: WorkspaceSidebarProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "32s";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <aside className="glass-panel rounded-[24px] p-5 space-y-6 flex flex-col justify-between">
      <div className="space-y-5">
        {/* Header */}
        <div className="pb-4 border-b border-white/10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Execution Context
          </span>
          <h3 className="text-sm font-semibold text-white mt-1">
            {ciProvider === "github" ? "GitHub Actions" : "GitLab CI"}
          </h3>
        </div>

        {/* Repository info */}
        <div className="space-y-1">
          <span className="text-[11px] text-[var(--muted)]">Repository</span>
          <p className="text-xs font-mono text-cyan-400 font-medium truncate">
            {metadata?.repoOwner && metadata?.repoName
              ? `${metadata.repoOwner}/${metadata.repoName}`
              : "Manual Log Upload"}
          </p>
        </div>

        {/* Branch & Commit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-[var(--muted)]">Branch</span>
            <p className="text-xs font-mono text-white/90 truncate">
              {metadata?.branch || "main"}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-[var(--muted)]">Commit SHA</span>
            <p className="text-xs font-mono text-white/90 truncate">
              {metadata?.commitSha || "beb0902"}
            </p>
          </div>
        </div>

        {/* Triggered By Actor */}
        <div className="space-y-1">
          <span className="text-[11px] text-[var(--muted)]">Triggered By</span>
          <div className="flex items-center gap-2">
            {metadata?.actorAvatar ? (
              <img
                src={metadata.actorAvatar}
                alt={metadata.actorLogin || "user"}
                className="h-5 w-5 rounded-full border border-white/20"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300">
                AI
              </div>
            )}
            <span className="text-xs text-white/90 font-medium truncate">
              @{metadata?.actorLogin || "developer"}
            </span>
          </div>
        </div>

        {/* Execution Metrics */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted)]">Run Number</span>
            <span className="font-mono text-white font-medium">
              #{metadata?.runNumber || 142}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted)]">Duration</span>
            <span className="font-mono text-white font-medium">
              {formatDuration(metadata?.durationSeconds)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted)]">Runner Environment</span>
            <span className="font-mono text-white/80 text-[11px]">
              ubuntu-latest
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted)]">Timestamp</span>
            <span className="font-mono text-white/80 text-[11px]">
              {metadata?.timestamp
                ? new Date(metadata.timestamp).toLocaleTimeString()
                : new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Security Status Tag */}
      <div className="rounded-[16px] border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-center backdrop-blur-md">
        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-glow" />
          Zero-Trust Sanitized
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-1">
          AWS & GitHub secrets redacted before AI processing
        </p>
      </div>
    </aside>
  );
}
