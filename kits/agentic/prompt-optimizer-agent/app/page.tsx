"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!input.trim()) return;

    setLoading(true);
    setOutput("");

    const res = await fetch("/api/optimize", {
      method: "POST",
      body: JSON.stringify({ prompt: input }),
    });

    const data = await res.json();
    setOutput(data.result);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 text-black">

      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-500 text-white flex items-center justify-center rounded-md font-bold">
            L
          </div>
          <span className="font-semibold text-sm">
            Lamatic.ai / Prompt Optimizer
          </span>
        </div>

        <div className="flex gap-4 text-sm">
          <a href="https://github.com/Lamatic/AgentKit" target="_blank">GitHub</a>
          <a href="https://lamatic.ai" target="_blank">Lamatic.ai →</a>
        </div>
      </nav>

      {/* Main */}
      <div className="flex justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">

          {/* Title */}
          <h1 className="text-2xl font-bold text-center">
            Prompt Optimizer
          </h1>

          {/* Input Card */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <span className="text-sm font-semibold">Input Prompt</span>
              <button
                onClick={() =>
                  setInput("Explain AI like I'm 5 years old")
                }
                className="text-red-500 text-xs"
              >
                Load Example →
              </button>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="w-full p-4 outline-none resize-none"
              placeholder="Enter your prompt..."
            />

            <div className="p-3 border-t">
              <button
                onClick={handleSubmit}
                className="w-full bg-red-500 text-white py-2 rounded-lg"
              >
                {loading ? "Optimizing..." : "Optimize Prompt"}
              </button>
            </div>
          </div>

          {/* Output */}
          {output && (
            <div className="bg-black text-white rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-700 flex justify-between">
                <span className="text-sm font-semibold">Optimized Prompt</span>
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="text-xs"
                >
                  Copy
                </button>
              </div>

              <pre className="p-4 text-sm whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 mt-10 pb-6">
        <p>
          Built by <span className="font-semibold text-black">Shiwam Kumar</span> · Lamatic AgentKit Challenge
        </p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="https://github.com/ShiwamKumar2208" target="_blank">GitHub</a>
          <a href="https://www.linkedin.com/in/shiwam-kumar-991a043b0/" target="_blank">LinkedIn</a>
        </div>
      </footer>

    </main>
  );
}