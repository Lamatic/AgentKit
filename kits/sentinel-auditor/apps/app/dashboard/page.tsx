"use client";

import { useState } from "react";
import { runModelAudit } from "../actions/audit";

export default function Dashboard() {
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [modelResponse, setModelResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    if (!userPrompt || !modelResponse) return;
    setLoading(true);
    setError(null);
    setAuditResult(null);

    try {
      const result = await runModelAudit({ userPrompt, modelResponse });
      setAuditResult(result);
    } catch (err: any) {
      setError(err.message || "Audit failed to execute.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left: Input Panel */}
        <div className="w-full md:w-1/2 space-y-6">
          <h2 className="text-2xl font-bold text-white">Injection Payload</h2>
          <textarea 
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter the user's prompt here..."
            className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 focus:border-blue-500 focus:outline-none"
          />
          <textarea 
            value={modelResponse}
            onChange={(e) => setModelResponse(e.target.value)}
            placeholder="Enter the model's generated response here..."
            className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 focus:border-purple-500 focus:outline-none"
          />
          <button 
            onClick={handleAudit}
            disabled={loading || !userPrompt || !modelResponse}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? "Running Security Audit..." : "Execute Evaluation"}
          </button>
        </div>

        {/* Right: Results Panel */}
        <div className="w-full md:w-1/2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-6">Audit Telemetry</h2>
          
          {!auditResult && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
              <p>System idle. Waiting for prompt injection.</p>
            </div>
          )}
          {!auditResult && !loading && error && (
            <div className="flex-1 flex flex-col items-center justify-center text-red-400 py-12 animate-fade-in">
              <p className="font-medium bg-red-500/10 px-4 py-2 rounded border border-red-500/20">{error}</p>
            </div>
          )}
          {loading && (
             <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
               <p className="text-blue-400 font-mono text-sm animate-pulse">Analyzing neural dimensions...</p>
             </div>
          )}
          {auditResult && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white">Operation Success</h3>
                <p className="text-slate-400 text-sm">Threat assessment completed.</p>
              </div>
              <pre className="p-4 bg-black rounded-lg text-xs text-green-400 overflow-auto border border-slate-800">
                {JSON.stringify(auditResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}