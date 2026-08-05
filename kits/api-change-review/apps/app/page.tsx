"use client";

import { useState } from "react";
import SpecInput from "../components/SpecInput";
import VerdictBanner from "../components/VerdictBanner";
import ChangeList from "../components/ChangeList";
import MarkdownPanel from "../components/MarkdownPanel";
import { reviewApiChanges } from "../actions/orchestrate";
import type { ReviewResult } from "../lib/types";

const AUDIENCES = [
  { id: "consumer developers", label: "Consumer developers" },
  { id: "release notes", label: "Public release notes" },
];

export default function Page() {
  const [oldSpecText, setOldSpecText] = useState("");
  const [newSpecText, setNewSpecText] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);

  async function loadExample() {
    setError(null);
    try {
      const [v1, v2] = await Promise.all([
        fetch("/samples/billing-api-v1.yaml").then((r) => r.text()),
        fetch("/samples/billing-api-v2.yaml").then((r) => r.text()),
      ]);
      setOldSpecText(v1);
      setNewSpecText(v2);
      setResult(null);
    } catch {
      setError("Could not load the example specs.");
    }
  }

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await reviewApiChanges({ oldSpecText, newSpecText, audience });
      if (res.ok) setResult(res.data);
      else setError(res.error);
    } catch (e: any) {
      // The action returns errors as values, but the call itself can still
      // reject — a dropped connection, or a server-action transport failure.
      // Without this the spinner never stops.
      setError(e?.message ?? "The request failed before it reached the server.");
    } finally {
      setLoading(false);
    }
  }

  const canRun = oldSpecText.trim() && newSpecText.trim() && !loading;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Change Review</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            Diff two versions of an OpenAPI spec, classify every change by consumer
            impact, and get migration notes plus a changelog entry you can paste
            into a release.
          </p>
        </div>
        <button
          type="button"
          onClick={loadExample}
          disabled={loading}
          className="rounded-lg border border-edge bg-panel px-3.5 py-2 text-sm font-medium transition hover:border-slate-500 disabled:opacity-50"
        >
          Load example
        </button>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <SpecInput
          label="Previous"
          hint="The spec consumers are on today"
          value={oldSpecText}
          onChange={setOldSpecText}
          disabled={loading}
        />
        <SpecInput
          label="New"
          hint="The spec you want to ship"
          value={newSpecText}
          onChange={setNewSpecText}
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-edge bg-panel px-4 py-3">
        <div className="flex items-center gap-2">
          <label htmlFor="audience" className="text-sm text-muted">
            Write for
          </label>
          <select
            id="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={loading}
            className="rounded-md border border-edge bg-panel-2 px-2.5 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
          >
            {AUDIENCES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!canRun}
          className="ml-auto rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Reviewing…" : "Review changes"}
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-edge bg-panel px-4 py-3 text-sm text-muted">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent align-middle" />
          Diffing locally, then asking the flow to classify each change. This takes
          a few seconds.
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm"
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-4">
          <VerdictBanner result={result} />
          <ChangeList changes={result.changes ?? []} />
          <MarkdownPanel
            tabs={[
              { id: "migration", label: "Migration notes", content: result.migrationNotes },
              { id: "changelog", label: "Changelog", content: result.changelog },
            ]}
          />
        </div>
      ) : null}

      <footer className="mt-4 border-t border-edge pt-5 text-xs text-muted">
        The diff is deterministic and runs in this app. The flow does the judgment
        only — severity, consumer impact, and drafting.
      </footer>
    </main>
  );
}
