"use client";

import { Leaf, Loader2, Upload, Play, AlertTriangle } from "lucide-react";

type Props = {
  csv: string;
  onCsvChange: (v: string) => void;
  periodLabel: string;
  onPeriodChange: (v: string) => void;
  onAnalyze: () => void;
  onLoadExample: () => void;
  loading: boolean;
  error: string | null;
};

export function UploadPanel({
  csv,
  onCsvChange,
  periodLabel,
  onPeriodChange,
  onAnalyze,
  onLoadExample,
  loading,
  error,
}: Props) {
  const rowCount = csv.trim() ? csv.trim().split("\n").length - 1 : 0;

  return (
    <section className="rounded-[var(--radius)] border border-edge bg-panel/70 backdrop-blur p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Upload className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold tracking-wide text-ink">Usage export</h2>
        <span className="ml-auto text-xs text-muted-2">
          {rowCount > 0 ? `${rowCount} row${rowCount === 1 ? "" : "s"}` : "FOCUS CSV"}
        </span>
      </div>

      <textarea
        value={csv}
        onChange={(e) => onCsvChange(e.target.value)}
        spellCheck={false}
        placeholder="Paste a FOCUS-style usage CSV (ServiceName, ServiceCategory, RegionId, PricingUnit, PricingQuantity, …) — or press “Load example”."
        className="w-full h-44 resize-y rounded-[var(--radius-sm)] border border-edge bg-bg/60 px-3 py-2.5 text-xs leading-relaxed text-ink placeholder:text-muted-2 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
      />

      <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <label className="flex-1">
          <span className="block text-xs text-muted mb-1.5">Billing period label</span>
          <input
            value={periodLabel}
            onChange={(e) => onPeriodChange(e.target.value)}
            placeholder="July 2026"
            className="w-full rounded-[var(--radius-sm)] border border-edge bg-bg/60 px-3 py-2 text-sm text-ink placeholder:text-muted-2 outline-none focus:border-accent/60"
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={onLoadExample}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-edge-strong bg-panel-2 px-3.5 py-2 text-sm text-muted hover:text-ink hover:border-accent/40 transition disabled:opacity-50"
          >
            <Leaf className="w-3.5 h-3.5" /> Load example
          </button>
          <button
            onClick={onAnalyze}
            disabled={loading || csv.trim().length === 0}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-strong transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin-slow" /> : <Play className="w-4 h-4" />}
            {loading ? "Analyzing…" : "Analyze footprint"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-[var(--radius-sm)] border border-sev-high/40 bg-sev-high-soft px-3 py-2.5 text-xs text-sev-high">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
