"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  AlertTriangle,
  ServerCrash,
  DatabaseZap,
  Search,
  Zap,
  Loader2,
} from "lucide-react";
import { AttackPanelProps, AlertObject } from "../../lib/types";
import { PRESET_ATTACKS } from "../../lib/constants";
import JsonViewer from "../common/JsonViewer";

const severityColor: Record<string, string> = {
  P1: "badge-p1",
  P2: "badge-p2",
  P3: "badge-p3",
  P4: "badge-p4",
};

export default function AttackPanel({
  onAlertGenerated,
  isProcessing,
}: AttackPanelProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedAlert, setGeneratedAlert] = useState<AlertObject | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (prompt: string) => {
    if (generating || isProcessing) return;
    setGenerating(true);
    setError(null);
    setGeneratedAlert(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`Generator failed with status ${res.status}`);
      }

      const alert: AlertObject = await res.json();
      setGeneratedAlert(alert);
      onAlertGenerated(alert);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 h-[calc(100vh-140px)] max-h-[640px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Flame size={15} className="text-amber-400" />
          <span className="text-xs font-extrabold tracking-wider uppercase text-white">
            Incident Simulator (Flow 02)
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          Datadog / PagerDuty JSON
        </span>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-2 gap-2 flex-shrink-0">
        {PRESET_ATTACKS.map((preset) => {
          const Icon =
            preset.id.includes("db") || preset.id.includes("sql")
              ? DatabaseZap
              : preset.badge === "P1"
              ? ServerCrash
              : preset.badge === "P2"
              ? AlertTriangle
              : Flame;
          const color =
            preset.badge === "P1"
              ? "#ef4444"
              : preset.badge === "P2"
              ? "#f59e0b"
              : preset.badge === "P3"
              ? "#818cf8"
              : "#10b981";
          return (
            <button
              key={preset.id}
              id={`btn-preset-${preset.id}`}
              onClick={() => handleGenerate(preset.prompt)}
              disabled={generating || isProcessing}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 text-left disabled:opacity-40 disabled:cursor-not-allowed border"
              style={{
                background: `${color}15`,
                borderColor: `${color}35`,
                color: color,
              }}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="truncate">{preset.title}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Input Bar */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            id="input-custom-prompt"
            type="text"
            placeholder="Or describe a custom outage scenario..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              customPrompt.trim() &&
              handleGenerate(customPrompt)
            }
            disabled={generating || isProcessing}
            className="w-full rounded-xl text-xs pl-9 pr-3 py-2.5 bg-gray-900/80 border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          id="btn-fire-incident"
          onClick={() => customPrompt.trim() && handleGenerate(customPrompt)}
          disabled={generating || isProcessing || !customPrompt.trim()}
          className="btn-danger flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl"
        >
          {generating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Zap size={13} />
          )}
          <span>{generating ? "..." : "Fire"}</span>
        </button>
      </div>

      {/* Generated Alert JSON Output Box (scrolls internally, matching height!) */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-2xl border border-white/10 bg-[#090d16] shadow-inner">
        <div className="terminal-header flex-shrink-0 bg-gray-950/80 border-b border-white/10 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="terminal-dot" style={{ background: "#ef4444" }} />
            <div className="terminal-dot" style={{ background: "#f59e0b" }} />
            <div className="terminal-dot" style={{ background: "#10b981" }} />
            <span className="text-xs ml-2 font-mono text-gray-400">
              incident_alert.json
            </span>
          </div>
          {generatedAlert && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                severityColor[generatedAlert.severity]
              }`}
            >
              {generatedAlert.severity}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
          {generatedAlert ? (
            <JsonViewer data={generatedAlert} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
              <span>Click a preset or fire an alert to generate JSON...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl px-4 py-2.5 text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 flex-shrink-0"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
