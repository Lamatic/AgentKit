"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, Star, Trash2, Copy, Search, Play, CheckCircle2,
  CircleAlert, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { useHistory, HistoryEntry } from "@/lib/history";
import { useSessionUserId } from "@/components/session-provider";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const userId = useSessionUserId();
  const { history, toggleFavorite, deleteEntry, clearHistory } = useHistory(userId);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteEntry(id);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history
      .filter((e) => (favoritesOnly ? e.favorite : true))
      .filter((e) =>
        !q
          ? true
          : e.question.toLowerCase().includes(q) || e.sql.toLowerCase().includes(q)
      );
  }, [history, query, favoritesOnly]);

  return (
    <div className="relative min-h-screen bg-background font-body text-on-surface">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:px-12 lg:px-16">
        <header className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push("/")} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
                    clearHistory();
                  }
                }}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
          <h1 className="mb-4 font-headline text-5xl font-medium tracking-tight text-on-surface">
            Query History
          </h1>
          <p className="max-w-2xl text-lg text-on-surface-variant">
            A chronological record of your analytical explorations. Review, refine, and reuse past queries.
          </p>
        </header>

        {history.length > 0 && (
          <div className="mb-10 flex flex-wrap items-center gap-4 border-b border-outline-variant/60 pb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions or SQL..."
                className="w-72 rounded-lg border border-outline-variant bg-surface py-2 pl-9 pr-4 text-sm text-on-surface shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => setFavoritesOnly((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                favoritesOnly
                  ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                  : "border-outline-variant bg-surface text-primary hover:bg-surface-container-low"
              )}
            >
              <Star className={cn("h-4 w-4", favoritesOnly ? "fill-current" : "")} />
              Favorites Only
            </button>
          </div>
        )}

        {history.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-on-surface-variant">No query history yet.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/")}
            >
              Ask a Question
            </Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-on-surface-variant">
              No entries match your search.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {filtered.map((entry: HistoryEntry) => {
              const safe = entry.isSafe === "true";
              const copied = copiedId === entry.id;
              return (
                <article
                  key={entry.id}
                  className={cn(
                    "group rounded-xl border bg-surface-container-low p-6 shadow-soft transition-all duration-300 hover:border-outline-variant/80",
                    safe ? "border-outline-variant/30" : "border-error/20 hover:border-error/50"
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="mb-2 font-headline text-2xl font-medium text-on-surface transition-colors group-hover:text-primary">
                        {entry.question}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                        <span
                          className={cn(
                            "flex items-center gap-1 rounded-md px-2 py-1 font-medium",
                            safe
                              ? "bg-primary-fixed text-primary"
                              : "bg-error-container text-error"
                          )}
                        >
                          {safe ? (
                            <CheckCircle2 className="h-[14px] w-[14px]" />
                          ) : (
                            <CircleAlert className="h-[14px] w-[14px]" />
                          )}
                          {safe ? "Safe" : "Unsafe"}
                        </span>
                        <span>•</span>
                        <time>{new Date(entry.timestamp).toLocaleString()}</time>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {safe ? (
                            <ShieldCheck className="h-[14px] w-[14px] text-primary" />
                          ) : (
                            <ShieldAlert className="h-[14px] w-[14px] text-error" />
                          )}
                          {entry.isSafe === "true" ? "Safe Query" : "Read-only check failed"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        type="button"
                        title={entry.favorite ? "Unfavorite" : "Favorite"}
                        onClick={() => toggleFavorite(entry.id)}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                      >
                        <Star className={cn("h-4 w-4", entry.favorite && "fill-current text-primary")} />
                      </button>
                      <button
                        type="button"
                        title="Copy SQL"
                        onClick={() => handleCopy(entry.id, entry.sql)}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Run Again"
                        onClick={() => router.push(`/?question=${encodeURIComponent(entry.question)}`)}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="code-scroll overflow-x-auto rounded-lg border border-outline-variant/40 bg-surface p-4 font-mono text-sm text-on-surface-variant">
                    <pre><code>{entry.sql}</code></pre>
                  </div>
                  {entry.explanation && (
                    <p className="mt-3 text-sm text-on-surface-variant">{entry.explanation}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}