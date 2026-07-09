"use client";

import { useState } from "react";
import { triageAlert } from "../actions/orchestrate";

type TriageResult = {
  severity: "P1" | "P2" | "P3" | "P4";
  confidence: number;
  attack_technique_id: string;
  attack_technique_name: string;
  attack_tactic: string;
  summary: string;
  iocs: string[];
  remediation_steps: string[];
};

const severityStyles: Record<string, string> = {
  P1: "bg-p1/10 text-p1 border-p1/30",
  P2: "bg-p2/10 text-p2 border-p2/30",
  P3: "bg-p3/10 text-p3 border-p3/30",
  P4: "bg-p4/10 text-p4 border-p4/30"
};

export default function Home() {
  const [alertText, setAlertText] = useState("");
  const [queue, setQueue] = useState<TriageResult[]>([]);
  const [selected, setSelected] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!alertText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await triageAlert(alertText);
      setQueue(prev => [result, ...prev]);
      setSelected(result);
      setAlertText("");
    } catch (e) {
      setError("Triage failed. Check your flow ID and API key.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex h-screen bg-neutral-950 text-neutral-100">
      <div className="w-[380px] border-r border-neutral-800 flex flex-col">
        <div className="p-5 border-b border-neutral-800">
          <h1 className="text-lg font-semibold tracking-tight">SentinelIQ</h1>
          <p className="text-xs text-neutral-500 mt-1">Security alert triage</p>
        </div>

        <div className="p-5 flex flex-col gap-3 border-b border-neutral-800">
          <textarea
            value={alertText}
            onChange={e => setAlertText(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 h-32 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
            placeholder="Paste raw alert text..."
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !alertText.trim()}
            className="bg-neutral-100 text-neutral-900 rounded-lg py-2.5 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition"
          >
            {loading ? "Triaging..." : "Triage Alert"}
          </button>
          {error && <p className="text-xs text-p1">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {queue.length === 0 && (
            <p className="text-xs text-neutral-600 text-center mt-8">No alerts triaged yet</p>
          )}
          {queue.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelected(item)}
              className={`text-left p-3 rounded-lg border transition ${
                selected === item ? "border-neutral-600 bg-neutral-900" : "border-transparent hover:bg-neutral-900"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityStyles[item.severity]}`}>
                  {item.severity}
                </span>
                <span className="text-xs text-neutral-500">{item.confidence}%</span>
              </div>
              <p className="text-sm text-neutral-300 truncate">{item.attack_technique_name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="max-w-2xl mx-auto p-10 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded border ${severityStyles[selected.severity]}`}>
                {selected.severity}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight">{selected.attack_technique_name}</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
                <p className="text-neutral-500 text-xs mb-1">Confidence</p>
                <p className="font-medium">{selected.confidence}%</p>
              </div>
              <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
                <p className="text-neutral-500 text-xs mb-1">Tactic</p>
                <p className="font-medium">{selected.attack_tactic}</p>
              </div>
              <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
                <p className="text-neutral-500 text-xs mb-1">Technique ID</p>
                <p className="font-medium">{selected.attack_technique_id}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-400 mb-2">Summary</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">{selected.summary}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-400 mb-2">Indicators of Compromise</h3>
              <div className="flex flex-wrap gap-2">
                {selected.iocs.map((ioc, i) => (
                  <span key={i} className="text-xs font-mono bg-neutral-900 border border-neutral-800 rounded px-2 py-1">
                    {ioc}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-400 mb-2">Remediation</h3>
              <ul className="flex flex-col gap-2">
                {selected.remediation_steps.map((step, i) => (
                  <li key={i} className="text-sm text-neutral-300 flex gap-2">
                    <span className="text-neutral-600">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-neutral-600 text-sm">Select a triaged alert to view details</p>
          </div>
        )}
      </div>
    </main>
  );
}