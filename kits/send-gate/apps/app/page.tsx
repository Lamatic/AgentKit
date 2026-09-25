"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getMode, runSendGate } from "../actions/orchestrate";
import { Composer } from "../components/composer";
import { ResultPanel } from "../components/result-panel";
import { composerProblem, initialState, scenarioById, stateFromScenario, toRequest } from "../lib/composer-state";
import type { ComposerState } from "../lib/composer-state";
import type { GateResponse } from "../lib/types";

export default function Page() {
  const [state, setState] = useState<ComposerState>(initialState);
  const [submitted, setSubmitted] = useState("");
  const [response, setResponse] = useState<GateResponse | null>(null);
  const [mode, setMode] = useState<"flow" | "local" | null>(null);
  const [pending, start] = useTransition();

  const run = useCallback(
    (s: ComposerState) => {
      if (!s.draft.trim()) return;
      const req = toRequest(s);
      setSubmitted(req.draft);
      start(async () => setResponse(await runSendGate(req)));
    },
    [start]
  );

  useEffect(() => {
    getMode().then(setMode).catch(() => setMode("local"));
    // Shareable links: /?scenario=<id>&run=1 loads a scenario and runs it on arrival.
    const params = new URLSearchParams(window.location.search);
    const wanted = scenarioById(params.get("scenario"));
    if (!wanted) return;
    const next = stateFromScenario(wanted);
    setState(next);
    if (params.get("run") === "1") run(next);
  }, [run]);

  // Same gate for the button and the shortcut: nothing runs while a run is pending or the facts are malformed.
  const canRun = !pending && composerProblem(state) === null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (canRun) run(state);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, state, canRun]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2.5">
              <span className="text-lg font-semibold tracking-tight">send-gate</span>
              <span className="hidden text-sm text-muted sm:inline">Pre-send gate for messages agents write to customers</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink-2 sm:inline-flex">
              <span className={`h-1.5 w-1.5 rounded-full ${mode === "flow" ? "bg-ok" : mode === "local" ? "bg-warn" : "bg-line-strong"}`} />
              {mode === null ? "checking…" : mode === "flow" ? "Deployed Lamatic flow" : "Local mode, no judge"}
            </span>
            <button
              type="button"
              onClick={() => run(state)}
              disabled={!canRun}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Running…" : "Run gate"}
              <kbd className="hidden rounded-md border border-white/25 px-1.5 py-0.5 text-[10px] font-medium opacity-80 sm:inline">⌘↩</kbd>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:py-8">
        <Composer state={state} onChange={setState} />
        <ResultPanel response={response} draft={submitted} pending={pending} />
      </main>

      <footer className="mx-auto max-w-7xl px-5 pb-8 text-[11px] text-muted md:px-8">
        API Request → Code (claims, truth fetch, verify) → Condition → Generate JSON (judge) or pass-through → Code (decide, re-verify) → API Response.
        The same <span className="mono">lib/gate.js</span> runs here and inside both Code nodes.
      </footer>
    </div>
  );
}
