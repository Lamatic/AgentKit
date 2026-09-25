"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Loader2, Sparkles, Copy, Check, Star, Download,
  ShieldCheck, ShieldAlert, Table2, Timer, Search, RotateCcw,
  AlertTriangle, CircleAlert, WandSparkles, Code2, Database, Info,
} from "lucide-react";
import { executeFlow, type NLToSQLResponse } from "@/actions/orchestrate";
import { useHistory } from "@/lib/history";
import { useSessionUserId } from "@/components/session-provider";
import { csvEscapeCell } from "@/lib/csv";
import { downloadBlob } from "@/lib/download";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { CSSProperties } from 'react';

const saharaPrism: Record<string, CSSProperties> = {
  'code[class*="language-"]': {
    background: 'transparent', color: 'var(--on-surface)',
    fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: '1.75',
    margin: 0, padding: 0, textShadow: 'none',
  },
  'pre[class*="language-"]': {
    background: 'transparent', color: 'var(--on-surface)',
    fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: '1.75',
    margin: 0, padding: 0, whiteSpace: 'pre', wordSpacing: 'normal',
    wordBreak: 'normal', overflowWrap: 'normal', tabSize: 2,
  },
  comment: { color: 'var(--on-surface-variant)', fontStyle: 'italic' },
  prolog: { color: 'var(--on-surface-variant)' },
  cdata: { color: 'var(--on-surface-variant)' },
  punctuation: { color: 'var(--on-surface)' },
  keyword: { color: 'var(--primary)', fontWeight: 500 },
  boolean: { color: 'var(--primary)' },
  number: { color: 'var(--primary)' },
  property: { color: 'var(--primary)' },
  constant: { color: 'var(--primary)' },
  symbol: { color: 'var(--primary)' },
  string: { color: 'var(--tertiary)' },
  char: { color: 'var(--tertiary)' },
  function: { color: 'var(--tertiary)' },
  builtin: { color: 'var(--tertiary)' },
  operator: { color: 'var(--on-surface)' },
  'attr-value': { color: 'var(--tertiary)' },
  'attr-name': { color: 'var(--primary)' },
  selector: { color: 'var(--on-surface)' },
  important: { color: 'var(--error)', fontWeight: 500 },
  regex: { color: 'var(--tertiary)' },
};

const suggestedQueries = [
  { icon: Sparkles, label: "How many customers are active?" },
  { icon: Table2, label: "Average data usage by plan" },
  { icon: CircleAlert, label: "Recent failed transactions" },
];

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center pt-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NLToSQLResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const userId = useSessionUserId();
  const { history, addEntry, toggleFavorite } = useHistory(userId);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set question from URL parameter on mount. useSearchParams().get() already
  // percent-decodes the value (a single decode boundary), so it must be used
  // directly; decoding again would corrupt questions containing '%' and could
  // throw URIError.
  useEffect(() => {
    const paramQuestion = searchParams.get("question");
    if (paramQuestion) {
      setQuestion(paramQuestion);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await executeFlow({ question });

      if (response.success && response.data) {
        setResult(response.data);
        const entry = addEntry({
          question: question,
          sql: response.data.sql || "",
          explanation: response.data.explanation || "",
          isSafe: response.data.isSafe ?? "false",
        });
        setCurrentHistoryId(entry ? entry.id : null);
      } else {
        setError(response.error || "Execution failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setQuestion("");
    setError("");
    setFilterText("");
    setCurrentHistoryId(null);
    // Also clear the query parameter
    router.push("/");
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadCSV = () => {
    if (!result?.results || result.results.length === 0) {
      alert("No results to download");
      return;
    }
    // Convert results to CSV
    const headers = Object.keys(result.results[0] || {});
    const csvContent = [
      headers.map(h => csvEscapeCell(h)).join(","),
      ...result.results.map((row: Record<string, unknown>) =>
        headers.map(h => csvEscapeCell(row[h])).join(",")
      )
    ].join("\r\n");
    downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), "results.csv");
  };

  const handleDownloadJSON = () => {
    if (!result?.results) {
      alert("No results to download");
      return;
    }
    const jsonContent = JSON.stringify(result.results, null, 2);
    downloadBlob(new Blob([jsonContent], { type: "application/json;charset=utf-8;" }), "results.json");
  };

  const filteredResults = useMemo(() => {
    if (!result?.results || result.results.length === 0 || !filterText.trim()) {
      return result?.results || [];
    }
    const q = filterText.trim().toLowerCase();
    return result.results.filter((row: Record<string, unknown>) =>
      Object.values(row).some((v) =>
        v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      )
    );
  }, [result, filterText]);

  const isSafe = result?.isSafe === "true";
  const hasSql = !!result?.sql;
  const summary = result?.summary || "";
  const insights = Array.isArray(result?.insights) ? result.insights : [];
  const suggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
  const followUpQuestions = Array.isArray(result?.followUpQuestions) ? result.followUpQuestions : [];

  const renderResult = () => {
    if (!result) {
      return null;
    }

    const hasExplanation = !!result.explanation;
    const hasResults = result.results && result.results.length > 0;
    const hasWarnings = result.warnings && result.warnings.length > 0;
    const hasError = !!result.error;
    const rowCount = Array.isArray(result.results) ? result.results.length : (result.rowCount || 0);
    const currentEntry = history.find(entry => entry.id === currentHistoryId) || null;

    return (
      <div className="space-y-8">
        {/* Question headline */}
        <section className="space-y-6">
          <div className="flex items-start justify-between gap-8">
            <h1 className="font-headline text-4xl font-medium leading-tight tracking-tight text-on-surface md:text-5xl">
              {question || "Your query"}
            </h1>
            <div className="flex shrink-0 gap-2 pt-2">
              <button
                type="button"
                title="Copy question"
                onClick={() => handleCopy(question)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              >
                {copied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
              </button>
              <button
                type="button"
                title={currentEntry?.favorite ? "Unfavorite" : "Favorite"}
                onClick={() => {
                  if (currentHistoryId) {
                    toggleFavorite(currentHistoryId);
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-primary transition-colors hover:bg-primary-container/20"
              >
                <Star className={cn("h-5 w-5", currentEntry?.favorite ? "fill-current text-primary" : "")} />
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-outline-variant/40 py-3 text-sm">
            <div className="flex items-center gap-1.5">
              {isSafe ? (
                <>
                  <ShieldCheck className="h-[18px] w-[18px] text-primary" />
                  <span className="font-medium text-primary">Safe Query</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-[18px] w-[18px] text-error" />
                  <span className="font-medium text-error">Blocked</span>
                </>
              )}
            </div>
            {rowCount > 0 && (
              <>
                <span className="text-outline-variant">•</span>
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <Table2 className="h-[18px] w-[18px]" />
                  <span>{rowCount.toLocaleString()} row{rowCount === 1 ? "" : "s"}</span>
                </div>
              </>
            )}
            <span className="text-outline-variant">•</span>
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <Timer className="h-[18px] w-[18px]" />
              <span>Just now</span>
            </div>
          </div>
        </section>

        {/* Demo/remote processing note */}
        <div className="flex items-start gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low px-5 py-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
          <p className="text-sm leading-relaxed text-on-surface-variant">
            <span className="font-medium text-on-surface">Note:</span> Because the Lamatic flow
            depends on remote model/API processing, a query may occasionally return a blank or
            incomplete result. If this happens, try submitting the same question again. The flow may
            return the expected result on a subsequent attempt.
          </p>
        </div>

        {/* Warnings */}
        {hasWarnings && (
          <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-container p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-on-warning-container" />
            <div>
              <h3 className="mb-1 font-headline text-lg font-medium text-on-warning-container">
                Warnings
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-on-warning-container/90">
                {result.warnings!.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Error */}
        {hasError && (
          <div className="flex items-start gap-3 rounded-xl border border-error/40 bg-error-container p-4">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-on-error-container" />
            <div>
              <h3 className="mb-1 font-headline text-lg font-medium text-on-error-container">Error</h3>
              <p className="text-sm text-on-error-container/90">{result.error}</p>
            </div>
          </div>
        )}

        {(summary || insights.length > 0 || suggestions.length > 0 || followUpQuestions.length > 0) && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6 lg:col-span-1">
              <h3 className="mb-3 font-headline text-xl text-on-surface">Summary</h3>
              <p className="text-base leading-relaxed text-on-surface-variant">
                {summary || "No summary was returned for this result."}
              </p>
            </div>

            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6 lg:col-span-2">
              <div className="space-y-5">
                {insights.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-headline text-xl text-on-surface">Key insights</h3>
                    <ul className="space-y-3">
                      {insights.map((item: { title: string; detail: string }, index: number) => (
                        <li key={`${item.title}-${index}`} className="rounded-lg border border-outline-variant/30 bg-surface px-3 py-2">
                          <div className="font-medium text-on-surface">{item.title}</div>
                          <div className="text-sm text-on-surface-variant">{item.detail}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-headline text-xl text-on-surface">Recommendations</h3>
                    <ul className="space-y-3">
                      {suggestions.map((item: { action: string; reason: string }, index: number) => (
                        <li key={`${item.action}-${index}`} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                          <div className="font-medium text-on-surface">{item.action}</div>
                          <div className="text-sm text-on-surface-variant">{item.reason}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {followUpQuestions.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-headline text-xl text-on-surface">Follow-up questions</h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-on-surface-variant">
                      {followUpQuestions.map((questionText: string, index: number) => (
                        <li key={`${questionText}-${index}`}>{questionText}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Bento: Explanation + SQL */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-low p-8">
            <h3 className="mb-4 border-b border-outline-variant/40 pb-2 font-headline text-xl text-on-surface">
              Translation
            </h3>
            {hasExplanation ? (
              <p className="text-base leading-relaxed text-on-surface-variant">{result.explanation}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm italic text-on-surface-variant">
                  No explanation was generated by the workflow.
                </p>
                <p className="text-xs text-on-surface-variant">
                  <strong>Lamatic Studio fix:</strong> In the API Response node, map the{" "}
                  <code className="font-mono">explanation</code> field to the output of the
                  Generate Text node (or add an explanation generation step).
                </p>
              </div>
            )}
          </div>

          <div className="group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container-highest/30 px-6 py-3">
              <Code2 className="h-[18px] w-[18px] text-primary" />
              <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                Generated SQL
              </span>
            </div>
            <div className="flex items-start justify-between gap-2 px-6 py-4 sm:items-center">
              <div className="code-scroll flex-1 overflow-x-auto">
                {hasSql ? (
                  <SyntaxHighlighter language="sql" style={saharaPrism} customStyle={{ background: 'transparent' }}>
                    {result.sql}
                  </SyntaxHighlighter>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm italic text-on-surface-variant">
                      No SQL was generated by the workflow.
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      <strong>Lamatic Studio fix:</strong> In the API Response node, map the{" "}
                      <code className="font-mono">sql</code> field to the output of the
                      Generate Text node.
                    </p>
                  </div>
                )}
              </div>
              {hasSql && (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(result.sql || "")} className="gap-1">
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    Copy SQL
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results table */}
        {hasResults && (
          <section className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/50 bg-surface shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 bg-surface-container-low/50 px-6 py-4">
              <h3 className="font-headline text-lg font-medium text-on-surface">
                {/* keep heading text for E2E compatibility */}
                <span>Query Results</span>
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter results..."
                    className="w-48 rounded border border-outline-variant/60 bg-surface py-1.5 pl-8 pr-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={() => handleCopy(JSON.stringify(result.results, null, 2))} className="gap-1">
                  <Copy className="h-4 w-4" />
                  Copy Results
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadCSV} className="gap-1">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadJSON} className="gap-1">
                  <Download className="h-4 w-4" />
                  JSON
                </Button>
              </div>
            </div>

            <div className="table-scroll overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {Object.keys(result.results[0] || {}).map((key, index) => (
                      <th
                        key={index}
                        className="whitespace-nowrap border-b border-outline-variant/40 bg-surface-container-lowest px-6 py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-sm">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={Object.keys(result.results[0] || {}).length || 1} className="px-6 py-8 text-center text-on-surface-variant">
                        No rows match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((row: Record<string, unknown>, rowIndex: number) => {
                      const headers = Object.keys(result.results[0] || {});
                      return (
                        <tr key={rowIndex} className="transition-colors hover:bg-surface-container-low/50">
                          {headers.map((headerKey, colIndex) => {
                            const value = row[headerKey];
                            return (
                              <td key={colIndex} className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant">
                                {value === null ? (
                                  <span className="italic text-outline">null</span>
                                ) : value === undefined ? (
                                  <span className="italic text-outline">undefined</span>
                                ) : (
                                  String(value)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container-lowest px-6 py-3 text-xs text-on-surface-variant">
              <span>
                Showing {filteredResults.length} row{filteredResults.length === 1 ? "" : "s"}
              </span>
              {rowCount > 100 && (
                <span className="italic">
                  Large result set: {rowCount.toLocaleString()} rows returned
                </span>
              )}
            </div>
          </section>
        )}

        {/* Placeholder notice */}
        {hasResults &&
          result.results.length === 1 &&
          Object.values(result.results[0]).every(v => v === "..." || v === "string" || v === "number") && (
          <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-container p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-on-warning-container" />
            <p className="text-sm text-on-warning-container/90">
              <strong>Placeholder data detected.</strong> The results contain schema defaults,
              not real database values. The Microsoft SQL Server node may not be connected to a
              database, or its output mapping is not configured.
            </p>
          </div>
        )}

        <div className="flex justify-center pb-4">
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-12 gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-8 text-on-surface-variant shadow-sm hover:bg-surface-container-high"
          >
            <RotateCcw className="h-4 w-4" />
            Ask Another Question
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-body text-on-surface">
      {/* Warm ambient background */}
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-primary-container/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[30%] w-[30%] rounded-full bg-secondary-container/30 blur-[100px]" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-14 md:px-12">
        {!result && (
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-12">
            <div className="space-y-4 text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <WandSparkles className="h-7 w-7 text-primary" />
                <h2 className="font-headline text-5xl font-semibold tracking-tight text-on-surface md:text-6xl">
                  Ask your database a question
                </h2>
              </div>
              <p className="mx-auto max-w-2xl text-lg text-on-surface-variant md:text-xl">
                Natural language to precise SQL queries. Warm minimalism meets analytical power.
              </p>
              <div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low px-5 py-4 text-left">
                <Database className="mt-0.5 h-5 w-5 shrink-0 text-tertiary" />
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  <span className="font-medium text-on-surface">Demo Database:</span> This project
                  currently uses a demo database from the telecommunications sector. You can ask
                  questions about the database related to customers, subscriptions, billing, usage,
                  support, renewals, and other telecommunications data.
                </p>
              </div>
            </div>

            <Card className="group w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/80 p-2 shadow-bento backdrop-blur-md transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-bento-focus">
              <form onSubmit={handleSubmit}>
                <div className="relative flex items-center">
                  <WandSparkles className="absolute left-5 h-5 w-5 text-primary" />
                  <Textarea
                    id="question"
                    placeholder="Enter your question about the database..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (question.trim() && !isLoading) handleSubmit(e);
                      }
                    }}
                    className="h-auto min-h-[64px] resize-none border-none bg-transparent py-5 pl-14 pr-44 text-lg shadow-none focus-visible:ring-0 placeholder:text-outline sm:pr-40"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary/90 sm:px-6"
                    disabled={!question.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Ask Question
                  </Button>
                </div>
              </form>
            </Card>

            {error && (
              <div className="flex w-full items-start gap-3 rounded-xl border border-error/40 bg-error-container px-5 py-4">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-on-error-container" />
                <p className="text-sm font-medium text-on-error-container">{error}</p>
              </div>
            )}

            <div className="flex w-full flex-col items-center gap-4">
              <span className="text-xs font-medium uppercase tracking-wider text-secondary">
                Suggested Inquiries
              </span>
              <div className="flex flex-wrap justify-center gap-3">
                {suggestedQueries.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setQuestion(label);
                      setError("");
                    }}
                    className="flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-low px-4 py-2 text-sm text-on-surface transition-all hover:border-primary/30 hover:bg-surface-container hover:text-primary"
                  >
                    <Icon className="h-4 w-4 text-tertiary" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mx-auto max-w-6xl">
            {renderResult()}
          </div>
        )}
      </main>
    </div>
  );
}