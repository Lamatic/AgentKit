"use client";

import { useMemo } from "react";
import type { Diagnosis } from "@/lib/types";
import { formatConfidence, riskToBadgeBg } from "@/lib/utils";
import { WorkspaceRecoveryPlan } from "@/components/workspace/workspace-recovery-plan";

interface WorkspaceCenterPanelProps {
  diagnosis: Diagnosis;
  onJumpToEvidence?: (evidenceLine: string) => void;
}

export function WorkspaceCenterPanel({ diagnosis, onJumpToEvidence }: WorkspaceCenterPanelProps) {
  const { classification, analysis } = diagnosis;

  // Dynamically construct failure chronology events from cited evidence lines
  const dynamicChronology = useMemo(() => {
    const evidence = analysis.evidence_cited || [];
    if (evidence.length === 0) {
      return [
        { title: "Pipeline Execution Started", detail: "Runner initialized step sequence", color: "cyan" },
        { title: "Execution Failure Detected", detail: analysis.root_cause_summary, color: "rose" },
      ];
    }

    const events = [
      { title: "Pipeline Execution Started", detail: "Runner initialized job step sequence", color: "cyan" },
    ];

    evidence.forEach((line, index) => {
      const isTerminal = index === evidence.length - 1;
      events.push({
        title: `Failure Event Locus [Step ${index + 1}]`,
        detail: line,
        color: isTerminal ? "rose" : "amber",
      });
    });

    return events;
  }, [analysis]);

  return (
    <div className="glass-panel rounded-[32px] p-8 space-y-8 flex-1">
      {/* Category, Risk, Confidence Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            AI Diagnosis Summary
          </span>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-400 backdrop-blur-md">
              {classification.category}
            </span>
            {classification.sub_category && (
              <span className="rounded-full bg-white/5 border border-white/5 px-3 py-1 text-xs font-medium text-[var(--text-dim)] backdrop-blur-md">
                {classification.sub_category}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-xs font-medium border backdrop-blur-md ${riskToBadgeBg(diagnosis.risk.level).replace('bg-', 'bg-').replace('/20', '/10')}`}>
              Risk: {diagnosis.risk.level}
            </span>
          </div>
        </div>

        {/* Confidence Ring Indicator */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-[24px] px-5 py-3 self-start sm:self-auto backdrop-blur-xl shadow-sm">
          <div className="relative flex items-center justify-center h-10 w-10">
            <svg className="h-10 w-10 -rotate-90 transform drop-shadow-md" viewBox="0 0 36 36">
              <path
                className="text-white/5"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400"
                strokeDasharray={`${Math.round(classification.confidence_score * 100)}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">
              {Math.round(classification.confidence_score * 100)}%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white tracking-tight">Confidence Score</p>
            <p className="text-[11px] text-[var(--muted)]">{formatConfidence(classification.confidence_score)}</p>
          </div>
        </div>
      </div>

      {/* Root Cause Card */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Root Cause Analysis
        </h2>
        <div className="rounded-[24px] border border-rose-500/10 bg-gradient-to-br from-rose-950/10 to-transparent p-6 space-y-3 shadow-sm backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white tracking-tight">
            {analysis.root_cause_summary}
          </h3>
          <p className="text-[13px] text-[var(--text-dim)] leading-relaxed">
            {analysis.detailed_explanation}
          </p>
        </div>
      </div>

      {/* Autonomous AI Recovery Plan & Git Patch Layer */}
      <WorkspaceRecoveryPlan diagnosis={diagnosis} />

      {/* Cited Evidence Explorer */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Cited Evidence ({analysis.evidence_cited.length} Lines Isolated)
        </h2>
        <div className="space-y-2">
          {analysis.evidence_cited.map((line, idx) => (
            <div
              key={idx}
              onClick={() => onJumpToEvidence && onJumpToEvidence(line)}
              className="group cursor-pointer rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5 font-mono text-[11px] text-rose-300 hover:border-cyan-500/30 hover:bg-cyan-950/10 transition-all duration-300 flex items-center justify-between"
            >
              <div className="truncate pr-4">
                <span className="text-[var(--muted)] mr-3 opacity-70">[{idx + 1}]</span>
                <span className="group-hover:text-cyan-200 transition-colors">{line}</span>
              </div>
              <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Jump to line →
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Failure Chronology */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Failure Chronology ({dynamicChronology.length} Milestones)
        </h2>
        <div className="space-y-4 pl-3 border-l-[1.5px] border-white/10 ml-2">
          {dynamicChronology.map((ev, idx) => (
            <div key={idx} className="relative pl-5">
              <span
                className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-[var(--bg)] ${
                  ev.color === "cyan"
                    ? "bg-cyan-400"
                    : ev.color === "amber"
                    ? "bg-amber-400"
                    : "bg-rose-500"
                }`}
              />
              <p className={`text-sm font-medium tracking-tight ${ev.color === "rose" ? "text-rose-400" : "text-white/90"}`}>
                {ev.title}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{ev.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
