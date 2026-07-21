"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Finding, Severity } from "@/lib/types";
import { normalizeSeverity, SEVERITY_RANK } from "@/lib/severity";

// Highest-severity finding per line (lower rank = more severe).
function severityByLine(findings: Finding[]): Map<number, Severity> {
  const map = new Map<number, Severity>();
  for (const f of findings) {
    if (f.line == null) continue;
    const sev = normalizeSeverity(f.severity);
    const existing = map.get(f.line);
    if (!existing || SEVERITY_RANK[sev] < SEVERITY_RANK[existing]) {
      map.set(f.line, sev);
    }
  }
  return map;
}

export function AnnotatedDockerfile({ source, findings }: { source: string; findings: Finding[] }) {
  const [open, setOpen] = useState(true);
  const lines = source.replace(/\s+$/, "").split(/\r?\n/);
  const lineSev = severityByLine(findings);
  const flaggedCount = lineSev.size;

  return (
    <section className="overflow-hidden rounded-card border border-hairline bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-fg">
          {open ? <ChevronDown className="h-4 w-4 text-fg-muted" /> : <ChevronRight className="h-4 w-4 text-fg-muted" />}
          Annotated source
        </span>
        <span className="text-xs text-fg-muted">
          {lines.length} lines · {flaggedCount} flagged
        </span>
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-hairline">
          <div className="min-w-full py-2 font-mono text-[13px] leading-relaxed">
            {lines.map((line, i) => {
              const n = i + 1;
              const sev = lineSev.get(n);
              return (
                <div
                  key={n}
                  data-sev={sev}
                  className="flex items-center px-3"
                  style={sev ? { background: "var(--sev-bg)", boxShadow: "inset 2px 0 0 var(--sev-solid)" } : undefined}
                >
                  <span className="mr-3 flex w-3 justify-center">
                    {sev && <span className="h-2 w-2 rounded-full" style={{ background: "var(--sev-solid)" }} />}
                  </span>
                  <span className="mr-4 w-6 select-none text-right text-fg-muted">{n}</span>
                  <code className="whitespace-pre text-fg">{line || " "}</code>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
