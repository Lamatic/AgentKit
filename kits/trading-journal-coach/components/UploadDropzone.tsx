"use client";

import { useRef, useState } from "react";

export default function UploadDropzone({
  onCsv,
  loading,
}: {
  onCsv: (text: string) => void;
  loading: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = loading || sampleBusy; // in-flight guard: analysis running OR a sample fetch pending

  function readFile(f: File) {
    const r = new FileReader();
    r.onload = () => onCsv(String(r.result || ""));
    r.onerror = () => onCsv(""); // surfaces a parse/validation error rather than failing silently
    r.readAsText(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    if (busy) return; // don't start a second analysis while one is already running
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  }

  async function useSample() {
    if (busy) return;
    setSampleBusy(true);
    try {
      const res = await fetch("/sample-trades.csv");
      if (!res.ok) { onCsv(""); return; } // avoid feeding an error page into the CSV parser
      onCsv(await res.text());
    } catch {
      onCsv(""); // network failure → surface a clear parse/validation error
    } finally {
      setSampleBusy(false);
    }
  }

  return (
    <div
      className={`drop ${drag ? "drag" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
    >
      <h2>{busy ? "Analyzing…" : "Drop your trade-log CSV"}</h2>
      <p>
        Columns: <span className="mono">date, symbol, side, qty, entry, exit, pnl</span> (optional:{" "}
        <span className="mono">exitDate, notes</span>)
      </p>
      <div className="row">
        <button className="btn" disabled={busy} onClick={() => inputRef.current?.click()}>
          Choose file
        </button>
        <button className="btn ghost" disabled={busy} onClick={useSample}>
          Use sample data
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          if (busy) return;
          const f = e.target.files?.[0];
          if (f) readFile(f);
        }}
      />
      <div className="hint">Parsed in your browser — nothing leaves the page until you analyze.</div>
    </div>
  );
}
