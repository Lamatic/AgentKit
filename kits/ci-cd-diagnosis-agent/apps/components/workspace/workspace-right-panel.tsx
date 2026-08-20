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
    <aside className="glass-panel rounded-[32px] p-8 space-y-8 flex-1">
      {/* Suggested Fixes Header */}
      <div className="space-y-3 pb-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Suggested Verified Fix
          </h2>
          {resolution.is_fix_valid ? (
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-medium text-emerald-400 backdrop-blur-md">
              ✓ Verified Patch
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[10px] font-medium text-amber-400 backdrop-blur-md">
              ⚠ Unverified Patch
            </span>
          )}
        </div>
        <p className="text-[13px] text-[var(--text-dim)] leading-relaxed">
          {resolution.verification_notes}
        </p>
      </div>

      {/* Code Snippets */}
      <div className="space-y-5">
        {resolution.fixes.map((fix, idx) => (
          <div key={idx} className="rounded-[24px] border border-white/5 bg-black/20 p-5 space-y-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/90">{fix.description}</span>
              <button
                onClick={() => handleCopyCode(fix.code, idx)}
                className="rounded-[12px] border border-white/5 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10 hover:scale-95 transition-all duration-300 flex items-center gap-1.5"
              >
                {copiedIdx === idx ? "✓ Copied" : "Copy Code"}
              </button>
            </div>

            <pre className="rounded-[16px] bg-[#0a0a0c] p-4 font-mono text-xs text-cyan-300 overflow-x-auto border border-white/5 shadow-inner">
              <code>{fix.code}</code>
            </pre>
          </div>
        ))}
      </div>

      {/* Security Warnings */}
      {(resolution.security_warnings || risk.warning) && (
        <div className="rounded-[24px] border border-amber-500/10 bg-amber-950/10 p-5 space-y-2 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <span>⚠</span> Security & Operational Review
          </div>
          <p className="text-[12px] text-[var(--text-dim)] leading-relaxed">
            {resolution.security_warnings || risk.warning}
          </p>
        </div>
      )}

      {/* Dynamic RAG Knowledge Base References */}
      <div className="space-y-4 pt-6 border-t border-white/5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Retrieved RAG Knowledge Guides
        </h2>
        <div className="space-y-3">
          {dynamicKnowledgeArticles.map((art, i) => (
            <div key={i} className="group rounded-[20px] border border-white/5 bg-white/[0.02] p-4 space-y-1.5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white/90 group-hover:text-cyan-100 transition-colors">{art.title}</span>
                <span className="text-[9px] uppercase px-2 py-1 rounded-md bg-white/5 text-[var(--muted)] tracking-wider">{art.category}</span>
              </div>
              <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">{art.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
