"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, FileJson, Sparkles, Loader2, ArrowRight, AlertCircle } from "lucide-react";

export type UploadPanelProps = {
  onAnalyze: (input: { billingCsv: string; changeEventsJson: string; periodLabel: string }) => void;
  loading: boolean;
  error: string | null;
};

async function readFile(file: File): Promise<string> {
  return await file.text();
}

function DropField({
  label,
  hint,
  icon,
  accept,
  loadedHint,
  inputRef,
  onFile,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  accept: string;
  loadedHint: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onFile: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`group relative flex cursor-pointer flex-col items-center gap-2 rounded-sm border border-dashed px-4 py-6 text-center transition ${
        dragging
          ? "border-accent bg-accent-soft"
          : loadedHint
            ? "border-confidence-high/50 bg-confidence-high-soft"
            : "border-edge-strong bg-panel-2 hover:border-accent/60 hover:bg-accent-soft"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${loadedHint ? "border-confidence-high/40 text-confidence-high" : "border-edge-strong text-muted group-hover:text-accent"}`}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-2">{loadedHint ?? hint}</span>
    </label>
  );
}

export function UploadPanel({ onAnalyze, loading, error }: UploadPanelProps) {
  const [billingCsv, setBillingCsv] = useState<string | null>(null);
  const [changeEventsJson, setChangeEventsJson] = useState<string | null>(null);
  const [changeEventsCount, setChangeEventsCount] = useState<number | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const billingInput = useRef<HTMLInputElement>(null);
  const changesInput = useRef<HTMLInputElement>(null);

  async function loadExample() {
    setUploadError(null);
    try {
      const [csvRes, eventsRes] = await Promise.all([
        fetch("/samples/case-dataplane.csv"),
        fetch("/samples/change-events.json"),
      ]);
      if (!csvRes.ok || !eventsRes.ok) {
        throw new Error("Failed to load sample data.");
      }
      const [csv, events] = await Promise.all([csvRes.text(), eventsRes.text()]);
      const parsed = JSON.parse(events);
      if (!Array.isArray(parsed)) throw new Error("Sample change events file is not a JSON array.");
      setBillingCsv(csv);
      setChangeEventsJson(events);
      setChangeEventsCount(parsed.length);
      setPeriodLabel("2024-09-01 to 2024-09-28");
    } catch {
      setUploadError("Could not load sample data. Check your network connection and try again.");
    }
  }

  function handleChangeEventsFile(text: string) {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setUploadError("Change events file must be a JSON array.");
        return;
      }
      setUploadError(null);
      setChangeEventsJson(text);
      setChangeEventsCount(parsed.length);
    } catch {
      setUploadError("Change events file is not valid JSON.");
    }
  }

  const canAnalyze = !!billingCsv && !!changeEventsJson && !loading;

  return (
    <div className="rounded-(--radius) border border-edge bg-panel shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
      <div className="flex items-center justify-between border-b border-edge px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">1</span>
          <h2 className="text-sm font-semibold">Upload billing export + change log</h2>
        </div>
        <button
          type="button"
          onClick={loadExample}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent hover:bg-accent-soft disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Load example
        </button>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DropField
            label="FOCUS billing CSV"
            hint="Click or drag a .csv file"
            icon={<FileSpreadsheet className="h-4 w-4" strokeWidth={2} />}
            accept=".csv"
            inputRef={billingInput}
            loadedHint={billingCsv ? `${billingCsv.split("\n").length - 1} rows loaded` : null}
            onFile={async (file) => setBillingCsv(await readFile(file))}
          />
          <DropField
            label="Change events JSON"
            hint="Deploys, config, infra changes"
            icon={<FileJson className="h-4 w-4" strokeWidth={2} />}
            accept=".json"
            inputRef={changesInput}
            loadedHint={changeEventsCount !== null ? `${changeEventsCount} events loaded` : null}
            onFile={async (file) => handleChangeEventsFile(await readFile(file))}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="block w-full max-w-xs">
            <span className="text-xs font-medium text-muted">Period label</span>
            <input
              type="text"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="2024-09-01 to 2024-09-28"
              className="mt-1.5 block w-full rounded-sm border border-edge bg-panel-2 px-3 py-2 text-sm text-ink placeholder:text-muted-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft"
            />
          </label>

          <button
            type="button"
            disabled={!canAnalyze}
            onClick={() =>
              billingCsv &&
              changeEventsJson &&
              onAnalyze({ billingCsv, changeEventsJson, periodLabel: periodLabel || "current period" })
            }
            className="flex shrink-0 items-center justify-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-35"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Analyzing
              </>
            ) : (
              <>
                Analyze
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {(error || uploadError) && (
          <div className="flex items-start gap-2 rounded-sm border border-confidence-low/30 bg-confidence-low-soft px-3 py-2.5 text-sm text-confidence-low">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error || uploadError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
