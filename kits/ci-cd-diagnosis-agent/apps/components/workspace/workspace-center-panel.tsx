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
    <div className="glass-panel rounded-[24px] p-6 space-y-6 flex-1">
      {/* Category, Risk, Confidence Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            AI Diagnosis Summary
          </span>
          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300">
              {classification.category}
            </span>
            {classification.sub_category && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[var(--text-dim)]">
                {classification.sub_category}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${riskToBadgeBg(diagnosis.risk.level)}`}>
              Risk: {diagnosis.risk.level}
            </span>
          </div>
        </div>

        {/* Confidence Ring Indicator */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-[18px] px-4 py-2 self-start sm:self-auto">
          <div className="relative flex items-center justify-center h-9 w-9">
            <svg className="h-9 w-9 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400"
                strokeDasharray={`${Math.round(classification.confidence_score * 100)}, 100`}
                strokeWidth="3.5"
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
            <p className="text-xs font-bold text-white">Confidence Score</p>
            <p className="text-[10px] text-[var(--muted)]">{formatConfidence(classification.confidence_score)}</p>
          </div>
        </div>
      </div>

      {/* Root Cause Card */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Root Cause Analysis
        </h2>
        <div className="rounded-[18px] border border-rose-500/30 bg-rose-950/20 p-5 space-y-2.5">
          <h3 className="text-base font-bold text-white tracking-tight">
            {analysis.root_cause_summary}
          </h3>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed">
            {analysis.detailed_explanation}
          </p>
        </div>
      </div>

      {/* Autonomous AI Recovery Plan & Git Patch Layer */}
      <WorkspaceRecoveryPlan diagnosis={diagnosis} />

      {/* Cited Evidence Explorer */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Cited Evidence ({analysis.evidence_cited.length} Lines Isolated)
        </h2>
        <div className="space-y-2">
          {analysis.evidence_cited.map((line, idx) => (
            <div
              key={idx}
              onClick={() => onJumpToEvidence && onJumpToEvidence(line)}
              className="group cursor-pointer rounded-[14px] border border-white/10 bg-white/5 p-3 font-mono text-xs text-rose-300 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all flex items-center justify-between"
            >
              <div className="truncate pr-2">
                <span className="text-[var(--muted)] mr-2">[{idx + 1}]</span>
                <span className="group-hover:text-cyan-200">{line}</span>
              </div>
              <span className="text-[10px] text-cyan-400 group-hover:underline whitespace-nowrap">
                Jump to line →
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Failure Chronology */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Failure Chronology ({dynamicChronology.length} Milestones)
        </h2>
        <div className="space-y-3 pl-2 border-l-2 border-white/10 ml-2">
          {dynamicChronology.map((ev, idx) => (
            <div key={idx} className="relative pl-4">
              <span
                className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${
                  ev.color === "cyan"
                    ? "bg-cyan-400"
                    : ev.color === "amber"
                    ? "bg-amber-400"
                    : "bg-rose-500 pulse-glow"
                }`}
              />
              <p className={`text-xs font-semibold ${ev.color === "rose" ? "text-rose-400" : "text-white"}`}>
                {ev.title}
              </p>
              <p className="text-[11px] text-[var(--muted)] truncate">{ev.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
