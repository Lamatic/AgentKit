"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReportAnomaly } from "../lib/types";

export function EvidencePanel({ anomaly }: { anomaly: ReportAnomaly }) {
  const [open, setOpen] = useState(false);
  const { attribution, flags } = anomaly;

  if (attribution.rejectedCandidates.length === 0 && flags.length === 0) return null;

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-muted-2 transition hover:text-accent"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.25} />
        {open ? "Hide" : "Show"} rejected candidates & flags
      </button>
      {open && (
        <div className="mt-2.5 space-y-2.5 border-l border-edge pl-3">
          {attribution.rejectedCandidates.length > 0 && (
            <ul className="space-y-1">
              {attribution.rejectedCandidates.map((r, i) => (
                <li key={i} className="text-muted-2">
                  <span className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">{r.eventId}</span>{" "}
                  {r.whyNot}
                </li>
              ))}
            </ul>
          )}
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-edge bg-panel-2 px-2 py-0.5 text-[11px] font-medium text-confidence-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
