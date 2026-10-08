"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import StatusBadge from "./StatusBadge";

type ReleaseRollbackTabProps = {
  confidence: string;
  confidenceTone: "gray" | "green" | "amber";
  releaseStatus: string;
  releaseTone: "green" | "amber" | "red";
  rollbackOrder: string[];
  rollbackPossible: boolean;
  rollbackWarning: string;
};

export default function ReleaseRollbackTab({
  confidence,
  confidenceTone,
  releaseStatus,
  releaseTone,
  rollbackOrder,
  rollbackPossible,
  rollbackWarning,
}: ReleaseRollbackTabProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const rollbackSql = rollbackOrder.join("\n");

  const handleCopy = async () => {
    if (!rollbackPossible || rollbackOrder.length === 0) {
      return;
    }

    await navigator.clipboard.writeText(rollbackSql);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1400);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Release Decision
          </p>
          <div className="mt-2">
            <StatusBadge tone={releaseTone}>{releaseStatus}</StatusBadge>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Confidence
          </p>
          <div className="mt-2">
            <StatusBadge tone={confidenceTone}>{confidence}</StatusBadge>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Rollback Possible
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {rollbackPossible ? "YES" : "NO"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Rollback Availability
          </p>
          <div className="mt-2">
            <StatusBadge tone={rollbackPossible ? "green" : "red"}>
              {rollbackPossible ? "AVAILABLE" : "NOT AVAILABLE"}
            </StatusBadge>
          </div>
        </div>
      </div>

      {rollbackPossible ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Rollback Order
            </p>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              onClick={handleCopy}
              type="button"
            >
              {copyState === "copied" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="code-font mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-700">
            <code>{rollbackSql || ""}</code>
          </pre>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
            Rollback Warning
          </p>
          <p className="mt-3 text-sm leading-7 text-amber-900">
            {rollbackWarning}
          </p>
        </div>
      )}
    </div>
  );
}