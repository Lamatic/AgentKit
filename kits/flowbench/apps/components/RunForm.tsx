"use client";

import { useState, useRef } from "react";
import { executeBenchmark, type OrchestrationResult } from "../actions/orchestrate";
import { Play, Loader2, FileJson, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RunForm() {
  const [flowId, setFlowId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowId.trim() || !file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      const testCases = lines.map((line, i) => {
        try {
          return JSON.parse(line);
        } catch (err) {
          throw new Error(`Invalid JSON on line ${i + 1}`);
        }
      });

      if (testCases.length === 0) {
        throw new Error("No test cases found in file");
      }

      const result = await executeBenchmark(flowId.trim(), testCases);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Navigate to the report page
      if (result.run) {
        router.push(`/report/${result.run.runId}`);
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-8">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Play className="w-5 h-5 text-cyan-400" />
        New Benchmark Run
      </h2>
      
      <form onSubmit={handleRun} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Lamatic Flow ID
          </label>
          <input
            type="text"
            required
            value={flowId}
            onChange={(e) => setFlowId(e.target.value)}
            placeholder="e.g. ea04774a-bc7e-4134-b022-352056971fcf"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Test Cases (.jsonl)
          </label>
          <div 
            className="w-full bg-slate-950 border border-slate-800 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-slate-950/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              required
              accept=".jsonl"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <FileJson className="w-5 h-5" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="text-slate-500">
                <FileJson className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <span>Click to select a JSONL file</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !flowId || !file}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Benchmark...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Benchmark
            </>
          )}
        </button>
      </form>
    </div>
  );
}
