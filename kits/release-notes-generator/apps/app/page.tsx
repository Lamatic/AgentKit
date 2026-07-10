"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy, FileText, Loader2, Sparkles } from "lucide-react";
import { generateReleaseNotes } from "@/actions/orchestrate";
import { Header } from "@/components/header";

const SAMPLE = `Add dark mode toggle to settings page (#412)
fix: crash when uploading empty CSV (#419)
BREAKING: rename \`apiKey\` config option to \`token\`
bump next from 15.1 to 16.0
wip refactor auth middleware
Add retry with backoff to webhook delivery (#421)`;

export default function Home() {
  const [changes, setChanges] = useState("");
  const [version, setVersion] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotes("");
    setCopied(false);

    const res = await generateReleaseNotes({ changes, version, date });
    if (res.success && res.releaseNotes) {
      setNotes(res.releaseNotes);
    } else {
      setError(res.error ?? "Something went wrong.");
    }
    setLoading(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Release Notes Generator</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
            Paste your merged pull requests or commit messages and get clean, categorized release
            notes in seconds.
          </p>
        </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Version (optional)</span>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.2.0"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Date (optional)</span>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="2026-07-10"
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-sm font-medium">
              Merged PRs / commit messages
              <button
                type="button"
                onClick={() => setChanges(SAMPLE)}
                className="text-xs font-normal text-slate-400 underline hover:text-slate-600"
              >
                Load sample
              </button>
            </span>
            <textarea
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="One PR title or commit message per line…"
              className="h-64 w-full resize-none rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-slate-500 dark:border-slate-700"
            />
          </label>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !changes.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate release notes
              </>
            )}
          </button>
        </form>

        {/* Output */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" /> Release notes
            </span>
            {notes && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          {notes ? (
            <div className="notes max-h-[28rem] overflow-auto text-sm leading-relaxed">
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-center text-sm text-slate-400">
              Your generated release notes will appear here.
            </div>
          )}
        </div>
      </div>
      </main>
    </>
  );
}
