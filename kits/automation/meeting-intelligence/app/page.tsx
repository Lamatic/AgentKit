"use client";
import { useState } from "react";

type ActionItem = {
  task: string;
  owner: string;
  deadline: string;
  priority: "High" | "Medium" | "Low";
};

type MeetingResult = {
  summary: string;
  actionItems: ActionItem[];
  decisions: string[];
  followUpQuestions: string[];
};

export default function Home() {
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeetingResult | null>(null);
  const [error, setError] = useState("");

  async function analyzeNotes() {
    if (!notes.trim() || !email.trim()) {
        setError("Please provide both notes and a recipient email.");
        return;
    }
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          meetingNotes: notes, 
          recipientEmail: email
         }),
      });
      const data = await response.json();
      if (data.error) {
        setError("Something went wrong. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!result) return;
    const text = `
MEETING SUMMARY
${result.summary}

ACTION ITEMS
${result.actionItems.map((a) => `- ${a.task} | Owner: ${a.owner} | Deadline: ${a.deadline} | Priority: ${a.priority}`).join("\n")}

DECISIONS MADE
${result.decisions.map((d) => `- ${d}`).join("\n")}

FOLLOW UP QUESTIONS
${result.followUpQuestions.map((q) => `- ${q}`).join("\n")}
    `.trim();
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }

  const priorityStyle = {
    High: "bg-red-500/20 text-red-400 border border-red-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    Low: "bg-green-500/20 text-green-400 border border-green-500/30",
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">M</div>
          <span className="font-semibold text-white">Meeting Intelligence</span>
          <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">Powered by Lamatic.ai</span>
        </div>
        <a href="https://github.com/Lamatic/AgentKit" target="_blank" className="text-xs text-gray-400 hover:text-white transition-colors">
          AgentKit ↗
        </a>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            Turn messy notes into <span className="text-blue-400">clear action items</span>
          </h1>
          <p className="text-gray-400 text-lg">Paste your meeting notes below — the AI extracts tasks, decisions, and follow-ups instantly</p>
        </div>

        {/* Input */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Meeting Notes</label>
          <textarea
            className="w-full h-52 bg-gray-800 text-white rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 border border-gray-700"
            placeholder="Paste your raw meeting notes here...&#10;&#10;Example: ok so raj was saying the database is slow, priya said she will look into it by friday, john mentioned the login bug needs fixing before the demo on 25th, we decided to push the launch to next month..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Deliver Report To</label>
            <input
              type="email"
              className="w-full bg-gray-800 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 placeholder-gray-500"
              placeholder="manager@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-2 text-[10px] text-gray-500 italic">
              Enter team emails separated by commas (e.g., anurag@site.com, team@site.com)
            </p>
            <p className="mt-2 text-[10px] text-gray-500 italic">
              The AI will extract action items and send a formatted email to this address.
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500">{notes.length} characters</span>
            <button
              onClick={analyzeNotes}
              disabled={loading || !notes.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-8 py-3 rounded-xl transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing...
                </span>
              ) : "Analyze Meeting →"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">{error}</div>
        )}

        {result && (
          <div className="space-y-5">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Results</h2>
              <button
                onClick={copyToClipboard}
                className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg transition-all"
              >
                Copy All
              </button>
            </div>

            {/* Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400 text-lg">📋</span>
                <h3 className="font-semibold text-white">Summary</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Action Items */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">✅</span>
                <h3 className="font-semibold text-white">Action Items</h3>
                <span className="ml-auto text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{result.actionItems.length} tasks</span>
              </div>
              <div className="space-y-3">
                {result.actionItems.map((item, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-white mb-1">{item.task}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>👤 {item.owner}</span>
                        <span>•</span>
                        <span>📅 {item.deadline}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${priorityStyle[item.priority]}`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decisions + Follow Up in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔨</span>
                  <h3 className="font-semibold text-white">Decisions Made</h3>
                </div>
                <ul className="space-y-2">
                  {result.decisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">❓</span>
                  <h3 className="font-semibold text-white">Follow Up Questions</h3>
                </div>
                <ul className="space-y-2">
                  {result.followUpQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-yellow-400 mt-0.5 shrink-0">?</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}