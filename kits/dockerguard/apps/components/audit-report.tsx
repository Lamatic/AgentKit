"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import type { AuditReport, Finding, Severity } from "@/lib/types";
import {
  SEVERITY_ORDER,
  SEVERITY_LABEL,
  SEVERITY_ICON,
  normalizeSeverity,
} from "@/lib/severity";
import { ScoreRing } from "./score-ring";
import { AnnotatedDockerfile } from "./annotated-dockerfile";
import { CopyButton } from "./copy-button";

function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) counts[normalizeSeverity(f.severity)]++;
  return counts;
}

/**
 * Correct each finding's line number by matching its offending line back to the
 * real source. LLM line counts drift on blank lines; matching the text is exact.
 * Handles the redacted-secret case by falling back to the instruction's key prefix.
 */
function reconcileLines(findings: Finding[], source?: string): Finding[] {
  if (!source) return findings;
  const lines = source.replace(/\s+$/, "").split(/\r?\n/);
  return findings.map((f) => {
    const target = (f.instruction || "").trim();
    if (!target) return f;
    let idx = lines.findIndex((l) => l.trim() === target);
    if (idx === -1) idx = lines.findIndex((l) => l.trim().includes(target));
    if (idx === -1) {
      const key = target.split("=")[0].trim();
      if (key.length > 1) idx = lines.findIndex((l) => l.trim().startsWith(key));
    }
    return idx >= 0 ? { ...f, line: idx + 1 } : f;
  });
}

/** One finding, collapsed to a single line, expandable in place. */
function FindingRow({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const sev = normalizeSeverity(finding.severity);
  const Icon = SEVERITY_ICON[sev];

  return (
    <div data-sev={sev} className="border-b border-hairline last:border-b-0" style={{ boxShadow: "inset 3px 0 0 var(--sev-solid)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 py-3 pl-4 pr-3 text-left hover:bg-surface-2"
      >
        <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--sev-solid)" }} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{finding.title}</span>
        <span className="hidden shrink-0 rounded border border-hairline px-1.5 py-0.5 text-[11px] text-fg-muted sm:inline">
          {finding.category}
        </span>
        {finding.line != null && (
          <span className="shrink-0 font-mono text-xs text-fg-muted">line {finding.line}</span>
        )}
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-fg-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted" />
        )}
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4 pl-11">
          {finding.instruction && (
            <pre
              className="overflow-x-auto rounded-md px-3 py-2 font-mono text-[13px]"
              style={{ background: "var(--sev-bg)", boxShadow: "inset 2px 0 0 var(--sev-solid)" }}
            >
              <code className="text-fg">{finding.instruction}</code>
            </pre>
          )}
          <p className="text-sm leading-relaxed text-fg-secondary">
            <span className="font-medium text-fg-muted">Why. </span>
            {finding.why}
          </p>
          <div className="rounded-md border border-hairline bg-surface-2 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">Fix</span>
              <CopyButton text={finding.fix} label="Copy fix" />
            </div>
            <p className="text-sm leading-relaxed text-fg">{finding.fix}</p>
          </div>
          {finding.reference && (
            <p className="text-xs text-fg-muted">Reference: {finding.reference}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** A collapsible severity group (Critical, High, …). */
function SeverityGroup({ severity, findings }: { severity: Severity; findings: Finding[] }) {
  const [open, setOpen] = useState(true);
  if (findings.length === 0) return null;

  return (
    <div data-sev={severity} className="overflow-hidden rounded-card border border-hairline bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 border-b border-hairline bg-surface px-4 py-2.5 text-left"
        style={{ boxShadow: "inset 3px 0 0 var(--sev-solid)" }}
      >
        {open ? <ChevronDown className="h-4 w-4 text-fg-muted" /> : <ChevronRight className="h-4 w-4 text-fg-muted" />}
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sev-text)" }}>
          {SEVERITY_LABEL[severity]}
        </span>
        <span className="text-xs text-fg-muted">· {findings.length}</span>
      </button>
      {open && (
        <div>
          {findings.map((f, i) => (
            <FindingRow key={f.id || `${severity}-${i}`} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AuditReportView({ report, source }: { report: AuditReport; source?: string }) {
  const [passedOpen, setPassedOpen] = useState(false);
  const findings = reconcileLines(report.findings ?? [], source);
  const counts = countBySeverity(findings);
  const total = findings.length;
  const present = SEVERITY_ORDER.filter((s) => counts[s] > 0);

  return (
    <div className="space-y-5">
      {/* Score header */}
      <section className="flex flex-col items-start gap-6 rounded-card border border-hairline bg-surface p-6 sm:flex-row sm:items-center">
        <ScoreRing score={report.score} grade={report.grade} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-relaxed text-fg">{report.summary}</p>

          {/* distribution bar */}
          {total > 0 && (
            <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
              {present.map((s) => (
                <div key={s} data-sev={s} style={{ width: `${(counts[s] / total) * 100}%`, background: "var(--sev-solid)" }} />
              ))}
            </div>
          )}

          {/* severity count chips */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {present.length > 0 ? (
              present.map((s) => (
                <span key={s} data-sev={s} className="inline-flex items-center gap-1.5 text-sm">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--sev-solid)" }} />
                  <span className="font-medium text-fg">{counts[s]}</span>
                  <span className="text-fg-muted">{SEVERITY_LABEL[s]}</span>
                </span>
              ))
            ) : (
              <span className="text-sm text-fg-muted">No issues found.</span>
            )}
            <span className="text-xs text-fg-muted">
              · {report.input_type} · {total} finding{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      {/* Annotated source (signature) */}
      {source && findings.some((f) => f.line != null) && (
        <AnnotatedDockerfile source={source} findings={findings} />
      )}

      {/* Findings grouped by severity */}
      {SEVERITY_ORDER.map((s) => (
        <SeverityGroup key={s} severity={s} findings={findings.filter((f) => normalizeSeverity(f.severity) === s)} />
      ))}

      {/* Passed checks */}
      {report.passed_checks && report.passed_checks.length > 0 && (
        <section className="overflow-hidden rounded-card border border-hairline bg-surface">
          <button
            type="button"
            onClick={() => setPassedOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
          >
            {passedOpen ? <ChevronDown className="h-4 w-4 text-fg-muted" /> : <ChevronRight className="h-4 w-4 text-fg-muted" />}
            <CheckCircle2 className="h-4 w-4" style={{ color: "var(--band-a)" }} />
            <span className="text-sm font-medium text-fg">Passed checks</span>
            <span className="text-xs text-fg-muted">· {report.passed_checks.length}</span>
          </button>
          {passedOpen && (
            <ul className="border-t border-hairline px-4 py-3">
              {report.passed_checks.map((c, i) => (
                <li key={i} className="flex items-start gap-2 py-1 text-sm text-fg-secondary">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--band-a)" }} />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
