"use client";

import type { WorkspaceMetadata } from "@/lib/types";

interface WorkspaceSidebarProps {
  metadata?: WorkspaceMetadata | null;
  ciProvider: "github" | "gitlab";
}

export function WorkspaceSidebar({ metadata, ciProvider }: WorkspaceSidebarProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="glass-panel rounded-[24px] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Header / Context */}
        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
          <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Execution Context
            </span>
            <h3 className="text-sm font-semibold text-white">
              {ciProvider === "github" ? "GitHub Actions" : "GitLab CI"}
            </h3>
          </div>
        </div>

        {/* Repository & Branch */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Repository</span>
            <span className="text-xs font-mono text-cyan-400 font-medium">
              {metadata?.repoOwner && metadata?.repoName
                ? `${metadata.repoOwner}/${metadata.repoName}`
                : "Manual Log Upload"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Branch / Commit</span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-white/90">
              <span>{metadata?.branch || "main"}</span>
              <span className="text-[var(--muted)]">@</span>
              <span>{metadata?.commitSha ? metadata.commitSha.substring(0, 7) : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Run Details */}
        <div className="flex items-center gap-6 pl-6 border-l border-white/10 hidden lg:flex">
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Run #</span>
            <span className="text-xs font-mono text-white/90">{metadata?.runNumber ? `#${metadata.runNumber}` : "N/A"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Duration</span>
            <span className="text-xs font-mono text-white/90">{formatDuration(metadata?.durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Actor & Security Badge */}
      <div className="flex items-center gap-4">
        {metadata?.actorLogin && (
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            {metadata.actorAvatar ? (
              <img src={metadata.actorAvatar} alt={metadata.actorLogin} className="h-6 w-6 rounded-full border border-white/20" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300">
                AI
              </div>
            )}
            <span className="text-xs text-white/90 font-medium hidden sm:inline-block">
              @{metadata.actorLogin}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-semibold tracking-wide">Zero-Trust Sanitized</span>
        </div>
      </div>
    </div>
  );
}
