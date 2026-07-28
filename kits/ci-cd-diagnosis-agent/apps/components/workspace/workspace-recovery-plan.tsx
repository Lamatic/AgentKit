"use client";

import { useState } from "react";
import type { Diagnosis } from "@/lib/types";
import { generateRecoveryPlan } from "@/lib/recovery/recovery-engine";

interface WorkspaceRecoveryPlanProps {
  diagnosis: Diagnosis;
}

export function WorkspaceRecoveryPlan({ diagnosis }: WorkspaceRecoveryPlanProps) {
  const plan = generateRecoveryPlan(diagnosis);
  const [copiedCmdIdx, setCopiedCmdIdx] = useState<number | null>(null);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [copiedPr, setCopiedPr] = useState(false);
  const [showPatchDetails, setShowPatchDetails] = useState(true);

  const handleCopyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmdIdx(idx);
    setTimeout(() => setCopiedCmdIdx(null), 2000);
  };

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(plan.gitPatch.patchDiff);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const handleCopyPr = () => {
    const text = `# ${plan.gitPatch.prTitle}\n\n${plan.gitPatch.prDescription}\n\n### Commit Message\n\`\`\`\n${plan.gitPatch.commitMessage}\n\`\`\``;
    navigator.clipboard.writeText(text);
    setCopiedPr(true);
    setTimeout(() => setCopiedPr(false), 2000);
  };

  return (
    <div className="rounded-[20px] border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-5 animate-fade-in">
      {/* Header & Success Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 pulse-glow" />
            <h3 className="text-sm font-bold text-white">Autonomous AI Recovery Plan</h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Actionable execution steps, Git diff patch, and PR description template
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
            {plan.estimatedSuccessRate}% Estimated Success
          </span>
          <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 text-xs font-medium text-cyan-300">
            Risk: {plan.overallRiskLevel}
          </span>
        </div>
      </div>

      {/* Recovery Steps Execution List */}
      <div className="space-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Execution Recovery Steps
        </span>
        <div className="space-y-2.5">
          {plan.steps.map((step, idx) => (
            <div key={idx} className="rounded-[14px] border border-white/10 bg-black/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center border border-cyan-500/30">
                    {step.stepNumber}
                  </span>
                  <span className="text-xs font-semibold text-white">{step.title}</span>
                </div>

                <button
                  onClick={() => handleCopyCommand(step.command, idx)}
                  className="rounded-[10px] border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/20 transition-all flex items-center gap-1"
                >
                  {copiedCmdIdx === idx ? "✓ Copied" : "Copy Command"}
                </button>
              </div>

              <pre className="rounded-[10px] bg-black/60 p-2.5 font-mono text-xs text-cyan-300 overflow-x-auto border border-white/5">
                <code>$ {step.command}</code>
              </pre>
              <p className="text-[11px] text-[var(--muted)]">Expected: {step.expectedOutcome}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Git Diff Patch Section */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPatchDetails(!showPatchDetails)}
            className="flex items-center gap-2 text-xs font-semibold text-white hover:text-cyan-300 transition-all"
          >
            <span>{showPatchDetails ? "▼" : "▶"}</span>
            <span>Generated Unified Git Patch ({plan.gitPatch.targetFilename})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPatch}
              className="rounded-[10px] border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/20 transition-all"
            >
              {copiedPatch ? "✓ Copied Patch" : "Copy Patch"}
            </button>

            <button
              onClick={handleCopyPr}
              className="rounded-[10px] border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all"
            >
              {copiedPr ? "✓ Copied PR Text" : "Copy PR Description"}
            </button>
          </div>
        </div>

        {showPatchDetails && (
          <pre className="rounded-[12px] bg-black/80 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto border border-white/10 whitespace-pre">
            <code>{plan.gitPatch.patchDiff}</code>
          </pre>
        )}
      </div>

      {/* Rollback & Verification Safety Net */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
        {/* Rollback Steps */}
        <div className="rounded-[14px] border border-rose-500/20 bg-rose-950/20 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase text-rose-300">Emergency Rollback Commands</span>
          {plan.rollbackSteps.map((rb, i) => (
            <p key={i} className="font-mono text-[11px] text-rose-200">$ {rb}</p>
          ))}
        </div>

        {/* Verification Checklist */}
        <div className="rounded-[14px] border border-emerald-500/20 bg-emerald-950/20 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase text-emerald-300">Verification Checklist</span>
          {plan.verificationChecklist.map((vc, i) => (
            <p key={i} className="text-[11px] text-emerald-200">✓ {vc}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
