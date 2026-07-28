"use client";

import { useState, useMemo } from "react";
import type { Diagnosis } from "@/lib/types";

interface WorkspaceRightPanelProps {
  diagnosis: Diagnosis;
}

export function WorkspaceRightPanel({ diagnosis }: WorkspaceRightPanelProps) {
  const { resolution, risk, classification, analysis } = diagnosis;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Dynamically generate RAG Knowledge Base articles based on category and root cause
  const dynamicKnowledgeArticles = useMemo(() => {
    const categoryStr = (classification.category || "").toLowerCase();
    const rootCauseStr = (analysis.root_cause_summary || "").toLowerCase();

    if (categoryStr.includes("memory") || rootCauseStr.includes("heap") || rootCauseStr.includes("oom") || rootCauseStr.includes("137")) {
      return [
        {
          title: "V8 Heap Limit & Node.js Memory Allocation",
          category: "Infrastructure",
          summary: "Configuring max-old-space-size for Next.js & Docker build steps.",
        },
        {
          title: "Docker Container SIGKILL OOM Prevention",
          category: "Container Rules",
          summary: "Best practices for cgroup memory limits in GitHub Actions runners.",
        },
      ];
    }

    if (categoryStr.includes("depend") || rootCauseStr.includes("peer") || rootCauseStr.includes("npm") || rootCauseStr.includes("eresolve")) {
      return [
        {
          title: "npm Peer Dependency Resolution (--legacy-peer-deps)",
          category: "Package Manager",
          summary: "Resolving ERESOLVE lockfile mismatches across React 18 & React 19.",
        },
        {
          title: "Reproducible CI/CD Dependency Lock Best Practices",
          category: "Build Rules",
          summary: "Using npm ci vs npm install in automated pipeline runners.",
        },
      ];
    }

    if (categoryStr.includes("syntax") || categoryStr.includes("code") || rootCauseStr.includes("type") || rootCauseStr.includes("tsc")) {
      return [
        {
          title: "TypeScript Compiler Error Isolation Strategy",
          category: "Compilation",
          summary: "Isolating type inference crashes and missing property dereferences.",
        },
        {
          title: "Strict Null Checks & Optional Chaining Best Practices",
          category: "Code Quality",
          summary: "Preventing runtime TypeError and NullPointerExceptions in CI builds.",
        },
      ];
    }

    // Default dynamic fallback based on classification sub_category
    return [
      {
        title: `${classification.category || "CI/CD"} Failure Recovery Pattern`,
        category: classification.sub_category || "General",
        summary: `Standard operating procedures for resolving ${classification.category || "pipeline"} incidents.`,
      },
      {
        title: "GitHub Actions Runner Optimization Guidelines",
        category: "Pipeline Health",
        summary: "Improving workflow execution speed and failure resilience.",
      },
    ];
  }, [classification, analysis]);

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

      {/* Dynamic RAG Knowledge Base References */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Retrieved RAG Knowledge Guides
        </h2>
        <div className="space-y-2">
          {dynamicKnowledgeArticles.map((art, i) => (
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
