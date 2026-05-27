import { useState } from "react";
import {
  FileText,
  Search,
  BookOpen,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
  RotateCcw,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

async function callAnalyze(pdfUrl) {
  const res = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdf_url: pdfUrl }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Server error");
  return json.data;
}

export default function App() {
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pdfUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await callAnalyze(pdfUrl.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggle(key) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function reset() {
    setResult(null);
    setError(null);
    setPdfUrl("");
    setExpanded({});
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1 text-sm text-blue-300">
            <BookOpen size={14} />
            Powered by Lamatic.ai
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Research Paper Analyzer
          </h1>
          <p className="text-slate-400 text-lg">
            Paste a public PDF URL and get an instant structured academic breakdown.
          </p>
        </div>

        {/* Input form */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FileText
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://arxiv.org/pdf/2303.08774.pdf"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !pdfUrl.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-4 font-semibold transition"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analyzing paper…
                </>
              ) : (
                <>
                  <Search size={18} />
                  Analyze Paper
                </>
              )}
            </button>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-400/30 rounded-xl p-4 text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">

            {/* Title bar */}
            <div className="flex items-start justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
              <div>
                <h2 className="text-xl font-bold">{result.title}</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {result.authors?.join(", ")}
                  {result.year ? ` · ${result.year}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={copyJson}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm transition"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "JSON"}
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm transition"
                >
                  <RotateCcw size={14} />
                  New
                </button>
              </div>
            </div>

            {/* Plain English — always open */}
            <Section
              title="Plain English Summary"
              emoji="💡"
              content={result.plain_english_summary}
              alwaysOpen
            />

            <Section
              title="Problem Statement"
              emoji="❓"
              content={result.problem_statement}
              open={expanded["problem"]}
              onToggle={() => toggle("problem")}
            />
            <Section
              title="Methodology"
              emoji="⚙️"
              content={result.methodology}
              open={expanded["method"]}
              onToggle={() => toggle("method")}
            />
            <ListSection
              title="Key Findings"
              emoji="✅"
              items={result.key_findings}
              open={expanded["findings"]}
              onToggle={() => toggle("findings")}
            />
            <ListSection
              title="Limitations"
              emoji="⚠️"
              items={result.limitations}
              open={expanded["limits"]}
              onToggle={() => toggle("limits")}
            />
            <ListSection
              title="Follow-up Research Questions"
              emoji="🔬"
              items={result.follow_up_questions}
              open={expanded["followup"]}
              onToggle={() => toggle("followup")}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function Section({ title, emoji, content, alwaysOpen, open, onToggle }) {
  const isOpen = alwaysOpen || open;
  return (
    <div
      className={`border rounded-xl overflow-hidden ${
        alwaysOpen
          ? "border-blue-400/40 bg-blue-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <button
        onClick={onToggle}
        disabled={alwaysOpen}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold">{emoji} {title}</span>
        {!alwaysOpen && (open ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
      </button>
      {isOpen && (
        <p className="px-5 pb-5 text-slate-300 leading-relaxed">{content}</p>
      )}
    </div>
  );
}

function ListSection({ title, emoji, items, open, onToggle }) {
  return (
    <div className="border border-white/10 bg-white/5 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold">{emoji} {title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <ul className="px-5 pb-5 space-y-2">
          {items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-300">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
