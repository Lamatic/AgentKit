"use client";

import { DatasetSummary } from "@/lib/utils";
import { Database, AlertTriangle, Columns } from "lucide-react";

interface DataPreviewProps {
  summary: DatasetSummary;
  fileName: string;
}

const TYPE_COLORS: Record<string, string> = {
  numeric: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  categorical: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  datetime: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  boolean: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  unknown: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function DataPreview({ summary, fileName }: DataPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: <Database className="w-4 h-4 text-sky-400" />,
            label: "Rows",
            value: summary.rowCount.toLocaleString(),
          },
          {
            icon: <Columns className="w-4 h-4 text-violet-400" />,
            label: "Columns",
            value: summary.colCount,
          },
          {
            icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
            label: "Missing",
            value: `${summary.totalMissingPct}%`,
          },
          {
            icon: <span className="text-emerald-400 text-sm font-bold">#</span>,
            label: "Numeric cols",
            value: summary.columns.filter((c) => c.type === "numeric").length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-lg font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Column chips */}
      <div className="glass rounded-xl p-4">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
          Detected Columns
        </p>
        <div className="flex flex-wrap gap-2">
          {summary.columns.map((col) => (
            <span
              key={col.name}
              className={`text-xs px-2.5 py-1 rounded-full border font-mono ${TYPE_COLORS[col.type]}`}
            >
              {col.name}
              <span className="ml-1.5 opacity-60">{col.type.slice(0, 3)}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Sample data table */}
      {summary.sampleRows.length > 0 && (
        <div className="glass rounded-xl p-4 overflow-x-auto scrollbar-thin">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
            Sample Data (first {summary.sampleRows.length} rows)
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr>
                {summary.columns.slice(0, 8).map((col) => (
                  <th
                    key={col.name}
                    className="text-left text-slate-400 pr-4 pb-2 font-medium whitespace-nowrap"
                  >
                    {col.name}
                  </th>
                ))}
                {summary.columns.length > 8 && (
                  <th className="text-slate-600 pb-2">+{summary.columns.length - 8} more</th>
                )}
              </tr>
            </thead>
            <tbody>
              {summary.sampleRows.map((row, i) => (
                <tr key={i} className="border-t border-slate-800">
                  {summary.columns.slice(0, 8).map((col) => (
                    <td
                      key={col.name}
                      className="pr-4 py-1.5 text-slate-300 whitespace-nowrap max-w-[120px] truncate"
                    >
                      {String(row[col.name] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
