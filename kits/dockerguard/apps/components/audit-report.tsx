import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { AuditReport, Severity } from "@/lib/types";

const SEVERITY_STYLES: Record<Severity, { label: string; badge: string; border: string }> = {
  critical: { label: "Critical", badge: "bg-red-500/15 text-red-300 border-red-500/30", border: "border-l-red-500" },
  high: { label: "High", badge: "bg-orange-500/15 text-orange-300 border-orange-500/30", border: "border-l-orange-500" },
  medium: { label: "Medium", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30", border: "border-l-amber-500" },
  low: { label: "Low", badge: "bg-sky-500/15 text-sky-300 border-sky-500/30", border: "border-l-sky-500" },
  info: { label: "Info", badge: "bg-slate-500/15 text-slate-300 border-slate-500/30", border: "border-l-slate-500" },
};

function gradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case "A": return "text-emerald-400";
    case "B": return "text-lime-400";
    case "C": return "text-amber-400";
    case "D": return "text-orange-400";
    default: return "text-red-400";
  }
}

export function AuditReportView({ report }: { report: AuditReport }) {
  const severity = (s: string): Severity =>
    (["critical", "high", "medium", "low", "info"].includes(s) ? s : "info") as Severity;

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="flex items-center gap-6 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="text-center">
          <div className={`text-5xl font-bold ${gradeColor(report.grade)}`}>{report.grade}</div>
          <div className="mt-1 text-sm text-slate-400">{report.score}/100</div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-100">Audit summary</h2>
          <p className="mt-1 text-sm text-slate-300">{report.summary}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
            Detected type: {report.input_type} · {report.findings.length} finding
            {report.findings.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Findings */}
      {report.findings.length > 0 && (
        <div className="space-y-3">
          {report.findings.map((f) => {
            const style = SEVERITY_STYLES[severity(f.severity)];
            return (
              <div
                key={f.id}
                className={`rounded-lg border border-slate-700 border-l-4 ${style.border} bg-slate-900/60 p-4`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-100">{f.title}</span>
                  <span className={`rounded border px-2 py-0.5 text-xs ${style.badge}`}>{style.label}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{f.category}</span>
                  {f.line != null && (
                    <span className="ml-auto font-mono text-xs text-slate-500">line {f.line}</span>
                  )}
                </div>

                {f.instruction && (
                  <pre className="mt-3 overflow-x-auto rounded bg-black/40 p-2 font-mono text-xs text-slate-300">
                    {f.instruction}
                  </pre>
                )}

                <p className="mt-3 text-sm text-slate-300">
                  <span className="text-slate-500">Why: </span>
                  {f.why}
                </p>
                <p className="mt-2 text-sm text-emerald-300">
                  <span className="text-slate-500">Fix: </span>
                  {f.fix}
                </p>
                {f.reference && (
                  <p className="mt-2 text-xs text-slate-500">Reference: {f.reference}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Passed checks */}
      {report.passed_checks.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Already doing well
          </h3>
          <ul className="mt-2 space-y-1">
            {report.passed_checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.findings.length === 0 && report.input_type !== "unknown" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-700/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <Info className="h-4 w-4" />
          No issues found. This is a clean configuration.
        </div>
      )}
    </div>
  );
}
