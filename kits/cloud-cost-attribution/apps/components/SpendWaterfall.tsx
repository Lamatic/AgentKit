import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import type { Report } from "../lib/types";

function money(currency: string, n: number) {
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SpendWaterfall({ report }: { report: Report }) {
  const up = report.totalDeltaPct >= 0;
  const Trend = up ? TrendingUp : TrendingDown;

  return (
    <div className="overflow-hidden rounded-sm border border-edge bg-panel">
      <div className="border-b border-edge bg-panel-2/50 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-2">{report.periodLabel}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={`flex items-center gap-1.5 text-3xl font-semibold tracking-tight ${up ? "text-confidence-low" : "text-confidence-high"}`}
          >
            <Trend className="h-6 w-6" strokeWidth={2.25} />
            {money(report.currency, Math.abs(report.totalDeltaAbs))}
          </span>
          <span className="text-lg font-medium text-muted">
            ({up ? "+" : ""}
            {report.totalDeltaPct.toFixed(1)}% vs. baseline)
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{report.execSummary}</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-edge sm:grid-cols-4">
        <Stat label="Current" value={money(report.currency, report.totalCurrent)} />
        <Stat label="Baseline" value={money(report.currency, report.totalBaseline)} />
        <Stat label="Anomalies flagged" value={String(report.anomalies.length)} />
        <Stat label="Unattributed" value={String(report.unattributedCount)} muted={report.unattributedCount === 0} />
      </div>

      <div className="flex items-center gap-3 border-t border-edge bg-confidence-high-soft px-6 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-confidence-high/15 text-confidence-high">
          <PiggyBank className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <p className="text-sm">
          Estimated recoverable spend:{" "}
          <span className="text-base font-semibold text-confidence-high">
            {money(report.currency, report.totalEstimatedSavings)}/mo
          </span>
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-2">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${muted ? "text-muted" : "text-ink"}`}>{value}</p>
    </div>
  );
}
