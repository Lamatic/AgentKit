"use client";

import { useState } from "react";
import type { Diagnosis } from "@/lib/types";

interface WorkspaceRightPanelProps {
  diagnosis: Diagnosis;
}

export function WorkspaceRightPanel({ diagnosis }: WorkspaceRightPanelProps) {
  const { resolution, risk } = diagnosis;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <aside className="glass-panel rounded-[24px] p-6 space-y-6 flex-1 max-w-md">
      {/* Suggested Fixes Header */}
      <div className="space-y-3 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Suggested Verified Fix
          </h2>
          {resolution.is_fix_valid ? (
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              ✓ Verified Patch
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
              ⚠ Unverified Patch
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-dim)] leading-relaxed">
          {resolution.verification_notes}
        </p>
      </div>

      {/* Code Snippets */}
      <div className="space-y-4">
        {resolution.fixes.map((fix, idx) => (
          <div key={idx} className="rounded-[18px] border border-white/10 bg-black/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{fix.description}</span>
              <button
                onClick={() => handleCopyCode(fix.code, idx)}
                className="rounded-[10px] border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/20 transition-all flex items-center gap-1"
              >
                {copiedIdx === idx ? "✓ Copied" : "Copy Code"}
              </button>
            </div>

            <pre className="rounded-[12px] bg-black/60 p-3 font-mono text-xs text-cyan-300 overflow-x-auto border border-white/5">
              <code>{fix.code}</code>
            </pre>
          </div>
        ))}
      </div>

      {/* Security Warnings */}
      {(resolution.security_warnings || risk.warning) && (
        <div className="rounded-[18px] border border-amber-500/30 bg-amber-950/20 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <span>⚠</span> Security & Operational Review
          </div>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed">
            {resolution.security_warnings || risk.warning}
          </p>
        </div>
      )}

      {/* RAG Knowledge Base References */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Retrieved Knowledge Base Guides
        </h2>
        <div className="space-y-2">
          {[
            {
              title: "Docker Exit Code 137 OOM Mitigation",
              category: "Infrastructure",
              summary: "How to configure V8 old-space-size and Docker Compose memory limits.",
            },
            {
              title: "GitHub Actions Memory Allocation Guidelines",
              category: "CI/CD Rules",
              summary: "Best practices for runner heap tuning and container resource allocation.",
            },
          ].map((art, i) => (
            <div key={i} className="rounded-[14px] border border-white/10 bg-white/5 p-3 space-y-1 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{art.title}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-[var(--muted)]">{art.category}</span>
              </div>
              <p className="text-[11px] text-[var(--text-dim)]">{art.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
