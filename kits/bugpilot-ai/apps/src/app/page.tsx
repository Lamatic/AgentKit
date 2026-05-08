"use client";

import { useState } from "react";

export default function Home() {
  const [language, setLanguage] = useState("");
  const [error, setError] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [result, setResult] = useState("");

  const handleAnalyze = async () => {
    try {
      setResult("Analyzing bug...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          error,
          codeSnippet,
        }),
      });

      const data = await response.json();

      let output =
        typeof data.result === "string"
          ? data.result
          : JSON.stringify(data.result, null, 2);

      // Handle AI provider overload gracefully
      if (output.includes("503") || output.includes("high demand")) {
        output =
          "AI provider is currently busy. Please retry in a few seconds.";
      }

      setResult(output || "No response received.");
    } catch (error) {
      console.error(error);
      setResult("Something went wrong.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">BugPilot AI</h1>

        <p className="text-gray-400 mb-8">
          AI-powered debugging assistant for developers
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Programming Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-4 rounded bg-zinc-900 border border-zinc-700 outline-none focus:border-white"
          />

          <textarea
            placeholder="Paste Error Message"
            value={error}
            onChange={(e) => setError(e.target.value)}
            className="w-full h-32 p-4 rounded bg-zinc-900 border border-zinc-700 outline-none focus:border-white resize-none"
          />

          <textarea
            placeholder="Paste Code Snippet"
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            className="w-full h-64 p-4 rounded bg-zinc-900 border border-zinc-700 font-mono outline-none focus:border-white resize-none"
          />

          <button
            onClick={handleAnalyze}
            className="bg-white text-black px-6 py-3 rounded font-semibold hover:opacity-90 transition"
          >
            Analyze Bug
          </button>

          {result && (
            <div className="mt-8 p-6 rounded bg-zinc-900 border border-zinc-700 whitespace-pre-wrap leading-7">
              {result}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
