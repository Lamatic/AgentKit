import type { ReportAnomaly } from "../lib/types";
import { AttributionTrace } from "./AttributionTrace";
import { SavingsTable } from "./SavingsTable";
import { EvidencePanel } from "./EvidencePanel";

export function AnomalyCard({
  anomaly,
  currency,
  rank,
}: {
  anomaly: ReportAnomaly;
  currency: string;
  rank: number;
}) {
  return (
    <div className="rounded-(--radius) border border-edge bg-panel p-5 transition hover:border-edge-strong">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-panel-2 text-[11px] font-semibold text-muted-2">
            {rank}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{anomaly.service}</p>
            <p className="mt-0.5 text-xs text-muted-2">
              {anomaly.region} &middot; {anomaly.method} &middot; driver: {anomaly.driver}
            </p>
          </div>
        </div>
        <p className="shrink-0 text-right text-lg font-semibold tabular-nums">
          {currency} {anomaly.deltaAbs.toFixed(2)}
          <span className="ml-1.5 text-sm font-medium text-muted">
            ({anomaly.deltaPct >= 0 ? "+" : ""}
            {anomaly.deltaPct.toFixed(1)}%)
          </span>
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <AttributionTrace anomaly={anomaly} />
        <SavingsTable anomaly={anomaly} currency={currency} />
        <EvidencePanel anomaly={anomaly} />
      </div>
    </div>
  );
}
