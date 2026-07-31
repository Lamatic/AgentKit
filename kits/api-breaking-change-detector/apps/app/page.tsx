"use client";

import { useState } from "react";
import { Loader2, Sparkles, FileJson, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ApiBreakingChangeDetector() {
  const [oldSchema, setOldSchema] = useState("");
  const [newSchema, setNewSchema] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // 🚀 LAMATIC AI INTEGRATION POINT
      // Once your backend is ready, you will replace the setTimeout block below 
      // with your actual Lamatic orchestration action call, like this:
      // const response = await generateContent({ oldSchema, newSchema });
      // setResult(response);

      // Simulated AI response for UI testing purposes:
      setTimeout(() => {
        setResult(`
### 🚨 High Severity Breaking Changes Detected

**1. Field Removal: \`user_id\`**
* **Impact**: Breaks downstream authentication mapping.
* **Migration**: Update client apps to request \`account_id\` instead.

**2. Type Mutation: \`price\`**
* **Impact**: Changed from \`Integer\` to \`String\`. Math operations will fail.
* **Migration**: Explicitly parse \`price\` as a float on the client side.

---
### 💡 Recommended Developer Action
Release this as a **v2 endpoint** and set a 90-day deprecation warning for the v1 endpoint.
        `);
        setLoading(false);
      }, 1500);

    } catch (error) {
      console.error("Error analyzing schemas:", error);
      setResult("An error occurred while analyzing the schemas. Please check your API keys.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 p-8 flex flex-col items-center font-sans">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-2">
            <AlertTriangle className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            API Breaking Change Detector
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Paste your existing and updated API schemas below. Our AI agent will instantly analyze the structures, flag breaking changes, and generate a developer migration guide.
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Old Schema */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                <FileJson className="w-4 h-4 text-slate-400" />
                <span>Old API Schema (v1)</span>
              </label>
              <textarea
                value={oldSchema}
                onChange={(e) => setOldSchema(e.target.value)}
                placeholder='{\n  "user_id": 123,\n  "price": 99.99\n}'
                className="w-full h-72 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                required
              />
            </div>

            {/* New Schema */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                <FileJson className="w-4 h-4 text-slate-400" />
                <span>New API Schema (v2)</span>
              </label>
              <textarea
                value={newSchema}
                onChange={(e) => setNewSchema(e.target.value)}
                placeholder='{\n  "account_id": 123,\n  "price": "99.99"\n}'
                className="w-full h-72 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Schemas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Detect Breaking Changes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-800/80 p-8 rounded-2xl border border-slate-700 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2 border-b border-slate-700 pb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Analysis Breakdown</span>
            </h2>
            <div className="prose prose-invert prose-blue max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}