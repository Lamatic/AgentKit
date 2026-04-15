"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, X, Globe, Building2, ChevronRight, Trash2, Loader } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { analyzeCompetitorsAction } from "./actions";
import remarkGfm from 'remark-gfm';

type Competitor = { id: string; org_name: string; url: string };
type Result = { org_name: string; response: string };

export default function WatchdogDashboard() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const requestVersionRef = useRef(0);

  const closeModal = () => {
    setError("");
    setModalOpen(false);
    setNewName("");
    setNewUrl("");
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const invalidateAnalysis = () => {
    requestVersionRef.current += 1;
    setLoading(false);
    setAnalysisError("");
    setResults([]);
  };

  const addCompetitor = () => {
    if (!newName.trim() || !newUrl.trim()) { setError("Both fields are required."); return; }
    if (competitors.length >= 10) { setError("Maximum 10 competitors allowed."); return; }
    setCompetitors([...competitors, {
      id: crypto.randomUUID(), 
      org_name: newName.trim(),
      url: newUrl.trim()
    }]);
    invalidateAnalysis();
    closeModal();
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
    invalidateAnalysis();
  } 

  const normalizeWatchdogData = (raw: any): { results: any[] } => {
    // Handle stringified JSON from GraphQL
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    // Detect and convert to Canonical Form: { results: [...] }
    if (parsed?.results && Array.isArray(parsed.results)) return { results: parsed.results };
    if (parsed?.Result && Array.isArray(parsed.Result)) return { results: parsed.Result };
    if (Array.isArray(parsed)) return { results: parsed };

    return { results: [] }; // Safety fallback
  };

  const analyzeCompetitors = async () => {
    if (competitors.length === 0) return;
    setLoading(true);
    setResults([]);
    setAnalysisError("");
    const currentVersion = requestVersionRef.current;

    try {
      const result = await analyzeCompetitorsAction(competitors);
      if (currentVersion !== requestVersionRef.current) return;

      // Parse GraphQL response: { status, result }
      // const { results: rawResults } = normalizeWatchdogData(data.result);
      const { results: rawResults } = normalizeWatchdogData(result.result);

      const cleanResults: Result[] = rawResults.map((item: any) => ({
        org_name: item.org_name || "Unknown",
        response: item.response || (typeof item === "string" ? item : JSON.stringify(item)),
      }));

      setResults(cleanResults);
    } catch (err: any) {
      if (currentVersion === requestVersionRef.current) {
        setAnalysisError(err.message || "Something went wrong.");
      }
    } finally {
      if (currentVersion === requestVersionRef.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 px-6 py-12 md:py-16">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-150 h-100 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-100 h-75 bg-violet-600/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">

        <header className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[11px] font-medium tracking-widest uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI-Powered Intelligence
          </div>

          <h1 className="text-4xl md:text-7xl font-light text-slate-100 tracking-tighter mb-4 leading-tight">
            Intelligent{" "}
            <span className="font-serif text-indigo-400">Watchdog</span>
          </h1>

          <p className="text-slate-400 text-[15px] leading-relaxed max-w-lg mx-auto font-light">
            Our autonomous AI agent monitors competitor websites in real-time.
            It detects pricing shifts, identifies new features, and generates
            counter-strategies to keep your sales team ahead of the curve.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-px active:translate-y-0 cursor-pointer"
            >
              <Plus size={15} />
              Add Competitor
            </button>
            <span className="text-slate-600 text-sm italic">
              Try the watchdog — analyse competitors & get winning strategies
            </span>
          </div>
        </header>

        {competitors.length > 0 && (
          <div className="mb-8">
            <p className="text-[11px] font-medium tracking-widest uppercase text-slate-600 mb-3 flex items-center gap-2">
              Tracking
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-500/15 text-indigo-400 text-[10px] font-semibold">
                {competitors.length}
              </span>
            </p>

            <div className="flex flex-col gap-2">
              {competitors.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-[#111118] border border-white/[0.07] hover:border-white/13 rounded-xl px-4 py-3 transition-colors duration-150"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{c.org_name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[320px]">{c.url}</p>
                  </div>
                  <button
                    onClick={() => removeCompetitor(i)}
                    aria-label={`Remove ${c.org_name}`}
                    title={`Remove ${c.org_name}`}
                    className="text-slate-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all duration-150 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={analyzeCompetitors}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 cursor-pointer"
            >
              {loading
                ? <><Loader size={14} className="animate-spin" /> Analysing...</>
                : <>Run Intelligence Analysis <ChevronRight size={14} /></>}
            </button>
          </div>
        )}

        <div className={`bg-[#111118] border rounded-2xl overflow-hidden transition-colors duration-300 ${results.length > 0 ? "border-white/13" : "border-white/[0.07]"}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-[#16161f]">
            <span className="text-[11px] font-medium tracking-widest uppercase text-slate-500">
              Intelligence Reports
            </span>
            {loading && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Analysing
              </span>
            )}
            {results.length > 0 && !loading && (
              <span className="text-[11px] text-slate-600">
                {results.length} report{results.length > 1 ? "s" : ""} ready
              </span>
            )}
          </div>

          <div className="p-6 min-h-50">
            {analysisError && (
              <div className="flex items-start gap-3 bg-red-500/[0.07] border border-red-500/20 rounded-xl p-4">
                <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center text-red-400 text-[10px] font-bold shrink-0 mt-0.5">!</div>
                <div>
                  <p className="text-sm font-semibold text-red-400 mb-0.5">Analysis Failed</p>
                  <p className="text-sm text-red-300/80 leading-relaxed">{analysisError}</p>
                </div>
              </div>
            )}

            {!analysisError && loading && (
              <div className="flex flex-col items-center justify-center gap-4 py-10">
                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  Scanning competitor data
                  {[0, 1, 2].map(i => (
                    <span key={i} className="animate-bounce inline-block" style={{ animationDelay: `${i * 150}ms` }}>.</span>
                  ))}
                </span>
              </div>
            )}

            {!analysisError && !loading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-600">
                <div className="w-11 h-11 rounded-xl bg-[#16161f] border border-white/[0.07] flex items-center justify-center mb-1">
                  <Globe size={18} className="text-slate-600" />
                </div>
                <p className="text-sm">No reports yet.</p>
                <p className="text-xs text-slate-700">Add competitors above and run the analysis.</p>
              </div>
            )}

            {!analysisError && !loading && results.length > 0 && (
              <div className="flex flex-col gap-5">
                {results.map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#0a0a0f] border border-white/[0.07] hover:border-indigo-500/30 rounded-xl p-6 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2.5 mb-6 border-b border-white/5 pb-4">
                      <h3 className="text-xl font-light text-slate-100">{item.org_name}</h3>
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        Intelligence Report
                      </span>
                    </div>

                    <div className="space-y-1">      
                      {item.response === "NO_CHANGE" ? (
                          <span className="flex items-center gap-2 text-slate-600 italic">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />
                              No changes detected.
                          </span>
                      ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h2: ({ children }) => (
                                <h2 className="text-lg font-semibold text-slate-200 mt-8 mb-3 flex items-center gap-2">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mt-6 mb-2">{children}</h3>
                              ),
                              p: ({ children }) => (
                                <p className="text-slate-400 text-sm leading-relaxed my-3">{children}</p>
                              ),
                              strong: ({ children }) => (
                                <strong className="text-slate-200 font-semibold">{children}</strong>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-6 rounded-xl border border-white/[0.07]">
                                  <table className="w-full text-sm">{children}</table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="bg-indigo-500/10">{children}</thead>
                              ),
                              th: ({ children }) => (
                                <th className="text-left text-indigo-400 font-semibold text-[11px] uppercase tracking-wider px-4 py-3 border-b border-white/[0.07]">{children}</th>
                              ),
                              td: ({ children }) => (
                                <td className="text-slate-400 px-4 py-3 border-t border-white/5 align-top">{children}</td>
                              ),
                              tr: ({ children }) => (
                                <tr className="hover:bg-white/2 transition-colors">{children}</tr>
                              ),
                              hr: () => <hr className="border-white/[0.07] my-8" />,
                              ul: ({ children }) => (
                                <ul className="my-3 space-y-1.5 pl-4">{children}</ul>
                              ),
                              li: ({ children }) => (
                                <li className="text-slate-400 text-sm leading-relaxed flex gap-2 before:content-['▸'] before:text-indigo-500 before:shrink-0">{children}</li>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-indigo-500 bg-indigo-500/5 px-4 py-3 rounded-r-lg my-4 italic text-slate-400 text-sm">{children}</blockquote>
                              ),
                            }}
                          >
                            {item.response}
                          </ReactMarkdown>
                      )}      
                  </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md bg-[#16161f] border border-white/13 rounded-2xl p-7 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-slate-100">Add Competitor</h2>
                <p className="text-sm text-slate-500 mt-1">Enter organisation details to begin tracking</p>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close modal"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.07] text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all duration-150 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label htmlFor="org-name" className="block text-[11px] font-medium tracking-widest uppercase text-slate-500 mb-2">
                  Organisation Name
                </label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  <input
                    id="org-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                    placeholder="e.g. OpenAI"
                    autoFocus
                    className="w-full bg-[#0a0a0f] border border-white/[0.07] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/15 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-700 outline-none transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="target-url" className="block text-[11px] font-medium tracking-widest uppercase text-slate-500 mb-2">
                  Pricing / features / updates / Landing URL
                </label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  <input
                    id="target-url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                    placeholder="https://..."
                    className="w-full bg-[#0a0a0f] border border-white/[0.07] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/15 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-700 outline-none transition-all duration-150"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

            <div className="flex gap-2.5">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 text-sm text-slate-400 hover:text-slate-200 border border-white/[0.07] hover:border-white/13 rounded-xl transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addCompetitor}
                className="flex-2 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-150 cursor-pointer"
              >
                <Plus size={13} /> Add to Watchlist
              </button>
            </div>

            <p className="text-[11px] text-slate-700 text-right mt-4">{competitors.length}/10 competitors tracked</p>
          </div>
        </div>
      )}
    </div>
  );
}