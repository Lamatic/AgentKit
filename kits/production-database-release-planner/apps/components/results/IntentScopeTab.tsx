import type { RiskLevel } from "@/types/migrationPipeline";
import OperationList from "./OperationList";
import StatusBadge from "./StatusBadge";

type IntentScopeTabProps = {
  operations: string[];
  targetTables: string[];
  targetColumns: string[][];
  destructive: boolean;
  dataLossPotential: RiskLevel;
  explanation: string;
};

const riskToneMap: Record<RiskLevel, "gray" | "green" | "amber" | "red"> = {
  LOW: "green",
  MEDIUM: "amber",
  HIGH: "red",
  UNKNOWN: "gray",
};

export default function IntentScopeTab({
  operations,
  targetTables,
  targetColumns,
  destructive,
  dataLossPotential,
  explanation,
}: IntentScopeTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Operations
          </p>
          <div className="mt-3">
            <OperationList items={operations} emptyLabel="No operations" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Destructive
            </p>
            <div className="mt-2">
              <StatusBadge tone={destructive ? "red" : "green"}>
                {destructive ? "YES" : "NO"}
              </StatusBadge>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Data Loss Potential
            </p>
            <div className="mt-2">
              <StatusBadge tone={riskToneMap[dataLossPotential]}>
                {dataLossPotential === "UNKNOWN" ? "Unknown" : dataLossPotential}
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Target Tables
          </p>
          <ul className="mt-3 space-y-2">
            {targetTables.length > 0 ? (
              targetTables.map((table, index) => (
                <li key={`${table}-${index}`} className="text-sm text-slate-700">
                  {index + 1}. {table}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">None</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Target Columns
          </p>
          <div className="mt-3 space-y-3">
            {targetColumns.length > 0 ? (
              targetColumns.map((columns, index) => (
                <div
                  key={`${index}-${columns.join("-")}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Operation {index + 1}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {columns.length > 0 ? columns.join(", ") : "None"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">None</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Explanation
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{explanation}</p>
      </div>
    </div>
  );
}