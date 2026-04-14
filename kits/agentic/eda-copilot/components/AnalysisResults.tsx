"use client";

import { DatasetSummary } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  AlertTriangle,
  TrendingUp,
  Zap,
  Download,
  Info,
} from "lucide-react";

interface AnalysisResultsProps {
  summary: DatasetSummary;
  schemaResult: unknown;
  statisticalResult: unknown;
  mlResult: unknown;
}

function extractText(result: unknown): string {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result === "object") {
    const r = result as Record<string, unknown>;
    // Common Lamatic response shapes
    return (
      (r.output as string) ||
      (r.text as string) ||
      (r.content as string) ||
      (r.message as string) ||
      JSON.stringify(result, null, 2)
    );
  }
  return String(result);
}

function MissingDataBar({ columns }: { columns: DatasetSummary["columns"] }) {
  const data = columns
    .filter((c) => c.missingPct > 0)
    .sort((a, b) => b.missingPct - a.missingPct)
    .slice(0, 12);

  if (data.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm py-4">
        <span className="text-xl">✓</span> No missing values detected!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
        />
        <Tooltip
          formatter={(v: number) => [`${v}%`, "Missing"]}
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#f1f5f9",
          }}
        />
        <Bar dataKey="missingPct" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={
                entry.missingPct > 50
                  ? "#ef4444"
                  : entry.missingPct > 20
                  ? "#f59e0b"
                  : "#0ea5e9"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CorrelationCards({
  hints,
}: {
  hints: DatasetSummary["correlationHints"];
}) {
  if (hints.length === 0) {
    return <p className="text-slate-500 text-sm">No numeric pairs to compare.</p>;
  }
  const top = hints.slice(0, 6);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {top.map((h) => {
        const abs = Math.abs(h.correlation);
        const color =
          abs > 0.7
            ? "border-sky-500/40 bg-sky-500/10"
            : abs > 0.4
            ? "border-violet-500/40 bg-violet-500/10"
            : "border-slate-700 bg-slate-800/50";
        const label =
          abs > 0.7 ? "Strong" : abs > 0.4 ? "Moderate" : "Weak";
        const sign = h.correlation > 0 ? "positive" : "negative";
        return (
          <div key={`${h.col1}${h.col2}`} className={`rounded-xl p-3 border ${color}`}>
            <p className="text-xs font-mono text-slate-300 truncate">
              {h.col1} ↔ {h.col2}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-white">
                {h.correlation.toFixed(3)}
              </span>
              <span className="text-xs text-slate-400">
                {label} {sign}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NumericStats({ columns }: { columns: DatasetSummary["columns"] }) {
  const numeric = columns.filter((c) => c.type === "numeric").slice(0, 8);
  if (numeric.length === 0)
    return <p className="text-slate-500 text-sm">No numeric columns.</p>;

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            {["Column", "Mean", "Std", "Min", "Q25", "Median", "Q75", "Max", "Skew"].map(
              (h) => (
                <th key={h} className="text-left pb-2 pr-4 font-medium whitespace-nowrap">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {numeric.map((col) => (
            <tr key={col.name} className="border-b border-slate-900 hover:bg-slate-800/30">
              <td className="py-2 pr-4 font-mono text-sky-300 whitespace-nowrap">
                {col.name}
              </td>
              {[
                col.mean,
                col.std,
                col.min,
                col.q25,
                col.median,
                col.q75,
                col.max,
                col.skewness,
              ].map((v, i) => (
                <td key={i} className="py-2 pr-4 text-slate-300 whitespace-nowrap">
                  {v !== undefined ? Number(v).toFixed(3) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalysisResults({
  summary,
  schemaResult,
  statisticalResult,
  mlResult,
}: AnalysisResultsProps) {
  const schemaText = extractText(schemaResult);
  const statText = extractText(statisticalResult);
  const mlText = extractText(mlResult);

  const handleDownload = () => {
    const content = [
      "# EDA Copilot Report",
      `\nDataset: ${summary.rowCount} rows × ${summary.colCount} columns`,
      `Missing data: ${summary.totalMissingPct}%`,
      "\n---\n## Schema Analysis\n",
      schemaText,
      "\n---\n## Statistical Insights\n",
      statText,
      "\n---\n## ML Readiness Assessment\n",
      mlText,
    ].join("\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eda-copilot-report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Download button */}
      <div className="flex justify-end">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Numeric summary */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-sky-400" />
          <h2 className="font-semibold text-white">Statistical Summary</h2>
        </div>
        <NumericStats columns={summary.columns} />
      </section>

      {/* Missing data */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-white">Missing Data Analysis</h2>
        </div>
        <MissingDataBar columns={summary.columns} />
      </section>

      {/* Correlations */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-violet-400" />
          <h2 className="font-semibold text-white">Top Correlations</h2>
        </div>
        <CorrelationCards hints={summary.correlationHints} />
      </section>

      {/* AI schema insights */}
      {schemaText && (
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 flex items-center justify-center text-sky-400">🔍</span>
            <h2 className="font-semibold text-white">Schema Analysis</h2>
            <span className="ml-auto text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
              AI
            </span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-slate-300">
            <ReactMarkdown>{schemaText}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* AI statistical insights */}
      {statText && (
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 flex items-center justify-center text-violet-400">📊</span>
            <h2 className="font-semibold text-white">Statistical Insights</h2>
            <span className="ml-auto text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
              AI
            </span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-slate-300">
            <ReactMarkdown>{statText}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* ML Readiness */}
      {mlText && (
        <section className="glass rounded-2xl p-5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-white">ML Readiness Assessment</h2>
            <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              AI
            </span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-slate-300">
            <ReactMarkdown>{mlText}</ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  );
}
