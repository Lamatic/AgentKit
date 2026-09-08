"use client";

import { useEffect, useState, useTransition } from "react";
import { getMode, runSendGate } from "../actions/orchestrate";
import { ResultPanel } from "../components/result-panel";
import { SAMPLE_TRUTH_URL, SCENARIOS } from "../lib/scenarios";
import type { GateRequest, GateResponse } from "../lib/types";

const EMPTY: GateRequest = { draft: "", facts: "", recipient: "", policy: "", needsFactCheck: false, truthUrl: "" };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-dim">{label}</span>
        {hint && <span className="text-[11px] text-dim">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const box = "w-full rounded border border-line bg-panel px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-accent";

export default function Page() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [req, setReq] = useState<GateRequest>(() => ({ ...EMPTY, ...SCENARIOS[0] }));
  const [submitted, setSubmitted] = useState("");
  const [response, setResponse] = useState<GateResponse | null>(null);
  const [mode, setMode] = useState<"flow" | "local" | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    getMode().then(setMode).catch(() => setMode("local"));
    // Shareable links: /?scenario=<id>&run=1 loads a scenario and runs it on arrival.
    const params = new URLSearchParams(window.location.search);
    const wanted = SCENARIOS.find((s) => s.id === params.get("scenario"));
    if (!wanted) return;
    const next = { draft: wanted.draft, facts: wanted.facts, recipient: wanted.recipient, policy: wanted.policy, needsFactCheck: wanted.needsFactCheck, truthUrl: wanted.truthUrl };
    setScenarioId(wanted.id);
    setReq(next);
    if (params.get("run") === "1") {
      setSubmitted(next.draft);
      start(async () => setResponse(await runSendGate(next)));
    }
  }, []);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const load = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setScenarioId(id);
    setReq({ draft: s.draft, facts: s.facts, recipient: s.recipient, policy: s.policy, needsFactCheck: s.needsFactCheck, truthUrl: s.truthUrl });
    setResponse(null);
  };
  const run = () => {
    setSubmitted(req.draft);
    start(async () => setResponse(await runSendGate(req)));
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">send-gate</h1>
          <p className="mt-1 max-w-3xl text-sm text-dim">
            A pre-send gate for messages that AI agents write to customers. Every figure, date, link and status claim is pulled into a fixed Claims JSON,
            verified against a source of truth with an evidence class, judged by an LLM only when something needs judging, and any rewrite is re-verified before it ships.
          </p>
        </div>
        <div className="rounded border border-line bg-panel px-3 py-1.5 text-xs">
          {mode === null ? "checking mode…" : mode === "flow" ? <span className="text-ok">● deployed Lamatic flow</span> : <span className="text-warn">● local mode: deterministic stages only, no judge</span>}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => load(s.id)}
                className={`rounded-full border px-2.5 py-1 text-xs ${s.id === scenarioId ? "border-accent bg-accent/15 text-accent" : "border-line bg-panel text-dim hover:text-text"}`}
              >
                {s.title}
              </button>
            ))}
          </div>
          {scenario && (
            <div className="rounded-lg border border-line bg-panel p-3 text-xs">
              <p>{scenario.blurb}</p>
              <p className="mt-1.5 text-dim"><span className="font-semibold text-text">Expected:</span> {scenario.expect}</p>
            </div>
          )}

          <Field label="Draft" hint="what the agent wants to send">
            <textarea className={box} rows={4} value={req.draft} onChange={(e) => setReq({ ...req, draft: e.target.value })} />
          </Field>
          <Field label="Facts" hint="JSON the drafter is allowed to rely on">
            <textarea className={box} rows={6} value={req.facts} onChange={(e) => setReq({ ...req, facts: e.target.value })} />
          </Field>
          <Field label="Recipient" hint="JSON">
            <textarea className={box} rows={2} value={req.recipient} onChange={(e) => setReq({ ...req, recipient: e.target.value })} />
          </Field>
          <Field label="Policy" hint='optional JSON, e.g. {"alwaysCheck":true,"disableRules":["offer"]}'>
            <textarea className={box} rows={2} value={req.policy} onChange={(e) => setReq({ ...req, policy: e.target.value })} placeholder="{}" />
          </Field>
          <Field label="truth_url" hint="optional: the gate fetches facts itself">
            <input className={box} value={req.truthUrl} onChange={(e) => setReq({ ...req, truthUrl: e.target.value })} placeholder={SAMPLE_TRUTH_URL} />
          </Field>
          <p className="text-[11px] text-dim">
            In local mode <span className="font-mono">/api/truth</span> on this host works as a truth_url. The deployed flow runs on Lamatic&apos;s side, so give it a public URL there
            (the sample above is a static file with the same shape).
          </p>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={req.needsFactCheck} onChange={(e) => setReq({ ...req, needsFactCheck: e.target.checked })} />
            force fact check (the drafter&apos;s <span className="font-mono">needs_fact_check</span> flag)
          </label>
          <button
            type="button"
            onClick={run}
            disabled={pending || !req.draft.trim()}
            className="w-full rounded bg-accent px-3 py-2 text-sm font-semibold text-bg disabled:opacity-50"
          >
            {pending ? "Running the gate…" : "Run send-gate"}
          </button>
        </section>

        <section className="min-w-0">
          <ResultPanel response={response} draft={submitted} />
        </section>
      </div>

      <footer className="mt-8 border-t border-line pt-3 text-[11px] text-dim">
        Flow: API Request → Code (claims + truth fetch + deterministic verify) → Condition on needsFactCheck → Generate JSON (judge) → Code (decide, re-verify rewrite) → API Response.
        The same <span className="font-mono">lib/gate.js</span> runs in this app and inside both Code nodes.
      </footer>
    </main>
  );
}
