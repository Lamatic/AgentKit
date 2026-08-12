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
    <div className="rounded-[24px] border border-cyan-500/10 bg-gradient-to-br from-cyan-950/10 to-transparent p-6 space-y-6 animate-fade-in shadow-sm backdrop-blur-xl">
      {/* Header & Success Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">Autonomous AI Recovery Plan</h3>
          </div>
          <p className="text-[12px] text-[var(--muted)] mt-1">
            Actionable execution steps, Git diff patch, and PR description template
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-400 backdrop-blur-md">
            {plan.estimatedSuccessRate}% Estimated Success
          </span>
          <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-[11px] font-medium text-cyan-300 backdrop-blur-md">
            Risk: {plan.overallRiskLevel}
          </span>
        </div>
      </div>

      {/* Recovery Steps Execution List */}
      <div className="space-y-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Execution Recovery Steps
        </span>
        <div className="space-y-3">
          {plan.steps.map((step, idx) => (
            <div key={idx} className="rounded-[20px] border border-white/5 bg-black/20 p-5 space-y-3 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px] font-semibold flex items-center justify-center border border-cyan-500/20">
                    {step.stepNumber}
                  </span>
                  <span className="text-[13px] font-semibold text-white/90">{step.title}</span>
                </div>

                <button
                  onClick={() => handleCopyCommand(step.command, idx)}
                  className="rounded-[12px] border border-white/5 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
                >
                  {copiedCmdIdx === idx ? "✓ Copied" : "Copy Command"}
                </button>
              </div>

              <pre className="rounded-[16px] bg-[#0a0a0c] p-4 font-mono text-xs text-cyan-300 overflow-x-auto border border-white/5 shadow-inner">
                <code>$ {step.command}</code>
              </pre>
              <p className="text-[11px] text-[var(--muted)] pl-1">Expected: {step.expectedOutcome}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Git Diff Patch Section */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPatchDetails(!showPatchDetails)}
            className="flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-cyan-300 transition-all"
          >
            <span className="text-[10px] opacity-70">{showPatchDetails ? "▼" : "▶"}</span>
            <span>Generated Unified Git Patch ({plan.gitPatch.targetFilename})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPatch}
              className="rounded-[12px] border border-white/5 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10 transition-all"
            >
              {copiedPatch ? "✓ Copied Patch" : "Copy Patch"}
            </button>

            <button
              onClick={handleCopyPr}
              className="rounded-[12px] border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all backdrop-blur-md"
            >
              {copiedPr ? "✓ Copied PR Text" : "Copy PR Description"}
            </button>
          </div>
        </div>

        {showPatchDetails && (
          <pre className="rounded-[20px] bg-[#0a0a0c] p-5 font-mono text-xs text-emerald-400 overflow-x-auto border border-white/5 shadow-inner whitespace-pre leading-relaxed">
            <code>{plan.gitPatch.patchDiff}</code>
          </pre>
        )}
      </div>

      {/* Rollback & Verification Safety Net */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
        {/* Rollback Steps */}
        <div className="rounded-[20px] border border-rose-500/10 bg-rose-950/10 p-5 space-y-2 backdrop-blur-md">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400/80">Emergency Rollback</span>
          {plan.rollbackSteps.map((rb, i) => (
            <p key={i} className="font-mono text-[11px] text-rose-300/90">$ {rb}</p>
          ))}
        </div>

        {/* Verification Checklist */}
        <div className="rounded-[20px] border border-emerald-500/10 bg-emerald-950/10 p-5 space-y-2 backdrop-blur-md">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">Verification Checklist</span>
          {plan.verificationChecklist.map((vc, i) => (
            <p key={i} className="text-[11px] text-emerald-300/90">✓ {vc}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
