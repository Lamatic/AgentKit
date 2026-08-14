import { Wrench, PiggyBank } from "lucide-react";
import type { ReportAnomaly } from "../lib/types";

function levelColor(level: string) {
  if (level === "low") return "text-confidence-high bg-confidence-high-soft";
  if (level === "high") return "text-confidence-low bg-confidence-low-soft";
  return "text-confidence-medium bg-confidence-medium-soft";
}

export function SavingsTable({ anomaly, currency }: { anomaly: ReportAnomaly; currency: string }) {
  const { remediation } = anomaly;
  return (
    <div className="rounded-sm border border-edge bg-panel-2 p-3.5 text-sm">
      <div className="flex items-start gap-2.5">
        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-muted-2" strokeWidth={2} />
        <div className="min-w-0">
          <p className="font-medium">{remediation.action}</p>
          {remediation.rationale && <p className="mt-0.5 text-muted-2">{remediation.rationale}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${levelColor(remediation.effort)}`}>
          effort: {remediation.effort}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${levelColor(remediation.risk)}`}>
          risk: {remediation.risk}
        </span>
        {remediation.prerequisites.length > 0 && (
          <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] font-medium text-muted">
            prereqs: {remediation.prerequisites.join(", ")}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-edge pt-3">
        <PiggyBank className="h-4 w-4 text-confidence-high" strokeWidth={2.25} />
        <p className="font-semibold text-confidence-high">
          est. {currency} {anomaly.estimatedMonthlySavings.toFixed(2)}/mo
        </p>
      </div>
    </div>
  );
}
