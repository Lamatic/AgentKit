"use client";

import { useState } from "react";
import { triageAlert } from "../actions/orchestrate";

type TriageResult = {
  severity: string;
  confidence: number;
  attack_technique_id: string;
  attack_technique_name: string;
  attack_tactic: string;
  summary: string;
  iocs: string[];
  remediation_steps: string[];
};

export default function Home() {
  const [alertText, setAlertText] = useState("");
  const [queue, setQueue] = useState<TriageResult[]>([]);
  const [selected, setSelected] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const result = await triageAlert(alertText);
    setQueue([result, ...queue]);
    setAlertText("");
    setLoading(false);
  }

  return (
    <main className="flex h-screen">
      <div className="w-1/3 border-r p-4 flex flex-col gap-2">
        <textarea
          value={alertText}
          onChange={e => setAlertText(e.target.value)}
          className="border p-2 h-40"
          placeholder="Paste raw alert text"
        />
        <button onClick={handleSubmit} disabled={loading} className="bg-black text-white p-2">
          {loading ? "Triaging..." : "Triage Alert"}
        </button>
        <div className="mt-4 flex flex-col gap-2">
          {queue.map((item, i) => (
            <button key={i} onClick={() => setSelected(item)} className="border p-2 text-left">
              <span className="font-bold">{item.severity}</span> — {item.attack_technique_name}
            </button>
          ))}
        </div>
      </div>
      <div className="w-2/3 p-4">
        {selected ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">{selected.severity} — {selected.attack_technique_name}</h2>
            <p>Confidence: {selected.confidence}%</p>
            <p>Tactic: {selected.attack_tactic}</p>
            <p>{selected.summary}</p>
            <div>
              <h3 className="font-semibold">IOCs</h3>
              <ul>{selected.iocs.map((ioc, i) => <li key={i}>{ioc}</li>)}</ul>
            </div>
            <div>
              <h3 className="font-semibold">Remediation</h3>
              <ul>{selected.remediation_steps.map((step, i) => <li key={i}>{step}</li>)}</ul>
            </div>
          </div>
        ) : (
          <p>Select a triaged alert to view details.</p>
        )}
      </div>
    </main>
  );
}