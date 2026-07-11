"use client";

import { useState } from "react";
import { GitBranch, Loader2, BookOpenCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { syncRepo } from "@/actions/orchestrate";

export function SyncPanel() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [days, setDays] = useState(7);
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<string | null>(null);
  const [commitCount, setCommitCount] = useState(0);

  async function handleSync() {
    setLoading(true);
    setError(null);
    setEntry(null);
    const result = await syncRepo(owner, repo, branch, days, project);
    setLoading(false);
    if (result.success && result.data) {
      setEntry(result.data.entry);
      setCommitCount(result.data.commitCount);
    } else {
      setError(result.error ?? "Something went wrong");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-600";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-zinc-100">Log work from GitHub</h2>
      </div>
      <p className="text-sm text-zinc-400">
        Fetches recent commits with their diffs and writes a journal entry into your diary.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <input className={inputClass} placeholder="owner (e.g. chirag)" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <input className={inputClass} placeholder="repo (e.g. dealdirect)" value={repo} onChange={(e) => setRepo(e.target.value)} />
        <input className={inputClass} placeholder="branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
        <input
          className={inputClass}
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Math.min(365, Math.max(1, Number(e.target.value) || 7)))}
          title="Days of history to fetch"
        />
      </div>
      <input
        className={inputClass}
        placeholder="project name (optional, defaults to repo)"
        value={project}
        onChange={(e) => setProject(e.target.value)}
      />

      <button
        onClick={handleSync}
        disabled={loading || !owner.trim() || !repo.trim()}
        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />}
        {loading ? "Reading diffs & writing entry..." : "Sync & log to diary"}
      </button>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {entry && (
        <div className="rounded-lg border border-emerald-900 bg-emerald-950/20 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-500">
            Logged from {commitCount} commit{commitCount === 1 ? "" : "s"}
          </p>
          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-zinc-200 [&_p]:my-1">
            <ReactMarkdown>{entry}</ReactMarkdown>
          </div>
        </div>
      )}
    </section>
  );
}
