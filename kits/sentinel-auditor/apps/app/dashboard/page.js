"use client";

import { useState } from "react";
import { runModelAudit } from "../actions/audit";

export default function Dashboard() {
  const [userPrompt, setUserPrompt] = useState("");
  const [modelResponse, setModelResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleAudit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAuditResult(null);
    setCopied(false);

    try {
      const response = await runModelAudit({ userPrompt, modelResponse });
      const parsedResult = typeof response.result === 'string' ? JSON.parse(response.result) : response.result;
      const finalData = parsedResult.result ? parsedResult.result : parsedResult;

      if (!finalData || !finalData.summary) {
        throw new Error("Invalid response format from API.");
      }
      setAuditResult(finalData);
    } catch (err) {
      setError(err.message || "Something went wrong during the audit.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (auditResult) {
      navigator.clipboard.writeText(JSON.stringify(auditResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Sentinel Workspace</h1>
              <p className="text-sm text-slate-500">Live evaluation environment</p>
            </div>
          </div>
          <a href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors border border-slate-800 px-4 py-2 rounded-lg hover:bg-slate-800">
            ← Back to Home
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form (Takes up 5 columns) */}
          <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-slate-800 h-fit">
            <form onSubmit={handleAudit} className="space-y-5">
              <div>
                <label className="flex items-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> User Prompt Injection
                </label>
                <textarea
                  required
                  rows="4"
                  className="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-200 placeholder-slate-700 font-mono text-sm resize-none"
                  placeholder="> Enter prompt..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span> Model Response
                </label>
                <textarea
                  required
                  rows="6"
                  className="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-slate-200 placeholder-slate-700 font-mono text-sm resize-none"
                  placeholder="> Enter output..."
                  value={modelResponse}
                  onChange={(e) => setModelResponse(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-4 rounded-xl transition-all hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? "Executing Protocol..." : "Run Security Audit"}
              </button>
            </form>
          </div>

          {/* Right Column: Dashboard (Takes up 7 columns) */}
          <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                Telemetry & Scoring
              </h2>
              {auditResult && (
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors border border-slate-700"
                >
                  {copied ? (
                    <><svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Copied!</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> Copy JSON</>
                  )}
                </button>
              )}
            </div>
            
            {/* Same loading and result logic as before, omitted for brevity, it's all in the code block! */}
            {!auditResult && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                <svg className="w-12 h-12 mb-4 text-slate-700 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <p>System idle. Waiting for prompt injection.</p>
              </div>
            )}

            {loading && (
               <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
                 <p className="text-blue-400 font-mono text-sm animate-pulse">Analyzing neural dimensions...</p>
               </div>
            )}

            {auditResult && !loading && (
              <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Overall Alignment</p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-4xl font-black ${auditResult.summary.overall_score < 3 ? 'text-red-400' : 'text-emerald-400'}`}>{auditResult.summary.overall_score}</p>
                      <span className="text-slate-500 font-medium">/ 5</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Threat Level</p>
                    <p className={`text-3xl font-black mt-1 ${auditResult.summary.risk_level === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>{auditResult.summary.risk_level}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(auditResult.dimensions).map(([key, data]) => (
                    <div key={key} className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-200 capitalize text-sm tracking-wide">{key.replace('_', ' ')}</span>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${data.score < 3 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {data.score} / 5
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed"><span className="text-slate-500 font-medium mr-1">Log:</span>{data.justification}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}