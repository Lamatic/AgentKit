"use client";

import { useState } from "react";
import type { Verification } from "../lib/gate";
import type { GateResponse } from "../lib/types";

const VERDICT: Record<string, { label: string; card: string; hint: string }> = {
  allow: { label: "Allow", card: "bg-ok-soft border-ok/30 text-ok", hint: "The draft goes out unchanged." },
  rewrite: { label: "Rewrite", card: "bg-warn-soft border-warn/30 text-warn", hint: "The draft is replaced by a rewrite that passed the same checks." },
  block: { label: "Block", card: "bg-bad-soft border-bad/30 text-bad", hint: "Nothing goes out. A person, or a better-grounded drafter, takes over." }
};

const STATUS: Record<string, string> = {
  verified: "bg-ok-soft text-ok",
  contradicted: "bg-bad-soft text-bad",
  unsupported: "bg-warn-soft text-warn",
  unverifiable: "bg-neutral-soft text-ink-2"
};

function Table({ rows, empty }: { rows: Verification[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-surface-2 text-[11px] uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Claim</th>
            <th className="px-3 py-2 font-semibold">Kind</th>
            <th className="px-3 py-2 font-semibold">Evidence class</th>
            <th className="px-3 py-2 font-semibold">Evidence</th>
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 font-semibold">Severity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v, i) => (
            <tr key={v.claimId + i} className="border-t border-line align-top">
              <td className="mono max-w-[18rem] px-3 py-2">{v.token}</td>
              <td className="px-3 py-2 text-ink-2">{v.kind}</td>
              <td className="px-3 py-2"><span className={`pill ${STATUS[v.status] ?? STATUS.unverifiable}`}>{v.status}</span></td>
              <td className="mono max-w-[22rem] px-3 py-2 text-xs text-ink-2">{v.evidence || v.message}</td>
              <td className="px-3 py-2 text-ink-2">{v.source}</td>
              <td className="px-3 py-2 text-ink-2">{v.severity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Step({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "ok" | "warn" | "bad" | "muted" }) {
  const dot = { neutral: "bg-accent", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", muted: "bg-line-strong" }[tone];
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${dot}`} />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
        <div className="text-sm font-medium leading-snug">{value}</div>
      </div>
    </div>
  );
}

export function ResultPanel({ response, draft, pending }: { response: GateResponse | null; draft: string; pending: boolean }) {
  const [showRaw, setShowRaw] = useState(false);

  if (pending) {
    return (
      <div className="card flex min-h-[28rem] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="pulse h-2.5 w-24 rounded-full bg-line-strong" />
        <div className="text-sm text-muted">Running the gate…</div>
      </div>
    );
  }
  if (!response) {
    return (
      <div className="card flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
        <div className="text-base font-medium">Nothing checked yet</div>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Pick a scenario or write your own message and facts, then press <span className="font-medium text-ink">Run gate</span> (or ⌘/Ctrl + Enter).
        </p>
        <ol className="mt-6 grid gap-2 text-left text-xs text-ink-2">
          <li><span className="mono text-muted">1</span>&nbsp; Claims JSON: every figure, date, link, status in the draft</li>
          <li><span className="mono text-muted">2</span>&nbsp; Each claim verified against the facts with an evidence class</li>
          <li><span className="mono text-muted">3</span>&nbsp; LLM judge, only when there is something to judge</li>
          <li><span className="mono text-muted">4</span>&nbsp; The rewrite is verified again before it can ship</li>
        </ol>
      </div>
    );
  }
  if (!response.ok || !response.result) {
    return (
      <div className="card border-bad/30 bg-bad-soft p-5">
        <div className="text-sm font-semibold text-bad">The gate did not run</div>
        <p className="mono mt-2 text-xs leading-relaxed text-ink-2">{response.error}</p>
      </div>
    );
  }

  const r = response.result;
  const v = VERDICT[r.verdict] ?? VERDICT.block;
  const changed = r.finalMessage != null && r.finalMessage !== draft;
  const figures = r.claims?.figures?.length ?? 0;
  const statements = r.claims?.statements?.length ?? 0;
  const flagged = (r.verifications ?? []).filter((x) => x.severity !== "info").length;

  return (
    <div className="space-y-4">
      <div className={`card border p-5 ${v.card}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-3xl font-semibold tracking-tight">{v.label}</div>
          <div className="text-xs text-ink-2">
            {response.mode === "flow" ? "Deployed Lamatic flow" : "Local mode"} · {(response.elapsedMs / 1000).toFixed(2)} s · judge {r.audit?.judgeUsed ? "used" : "skipped"} · facts from {r.audit?.provenance === "tool" ? "truth_url" : "the caller"}
          </div>
        </div>
        <div className="mt-1 text-sm text-ink-2">{v.hint}</div>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-5">
        <Step label="Claims" value={figures + statements ? `${figures} figures, ${statements} statements` : "none"} tone={figures + statements ? "neutral" : "muted"} />
        <Step label="Verify" value={r.audit?.needsFactCheck ? `${flagged} flagged` : "skipped (fast path)"} tone={!r.audit?.needsFactCheck ? "muted" : flagged ? "warn" : "ok"} />
        <Step label="Judge" value={r.audit?.judgeUsed ? `${(r.findings ?? []).filter((f) => f.source === "judge").length} extra findings` : "skipped"} tone={r.audit?.judgeUsed ? "neutral" : "muted"} />
        <Step label="Re-verify" value={r.rewriteCheck ? r.rewriteCheck.preVerdict : "not needed"} tone={r.rewriteCheck ? (r.rewriteCheck.preVerdict === "allow" ? "ok" : "bad") : "muted"} />
        <Step label="Verdict" value={v.label} tone={r.verdict === "allow" ? "ok" : r.verdict === "rewrite" ? "warn" : "bad"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="label">Draft, as written by the agent</div>
          <p className={`whitespace-pre-wrap text-[15px] leading-relaxed ${changed || r.finalMessage == null ? "text-muted line-through decoration-bad/50" : ""}`}>{draft}</p>
        </div>
        <div className="card p-5">
          <div className="label">What actually gets sent</div>
          {r.finalMessage == null ? (
            <p className="text-[15px] leading-relaxed text-bad">Nothing. {r.audit?.judgeNotes || ""}</p>
          ) : (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{r.finalMessage}</p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">Findings <span className="font-normal text-muted">({r.findings?.length ?? 0})</span></h3>
        <Table rows={r.findings ?? []} empty="Nothing to flag." />
      </div>

      {r.rewriteCheck && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold">
            Rewrite re-verified: <span className={r.rewriteCheck.preVerdict === "allow" ? "text-ok" : "text-bad"}>{r.rewriteCheck.preVerdict}</span>
          </h3>
          <Table rows={r.rewriteCheck.findings ?? []} empty="The rewrite introduced nothing that is not in the facts." />
        </div>
      )}

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">Claims JSON <span className="font-normal text-muted">· risk {r.claims?.risk}</span></h3>
        <div className="flex flex-wrap gap-1.5">
          {(r.claims?.figures ?? []).map((f) => (
            <span key={f.id} className="mono rounded-lg border border-line bg-white px-2 py-1 text-xs"><span className="text-muted">{f.kind}</span> {f.token}</span>
          ))}
          {(r.claims?.statements ?? []).map((s) => (
            <span key={s.id} className="mono rounded-lg border border-line bg-white px-2 py-1 text-xs"><span className="text-muted">{s.rule}</span> “{s.text}” <span className="text-muted">→ {s.never ? "forbidden" : s.factPath}</span></span>
          ))}
          {!figures && !statements && <span className="text-sm text-muted">No verifiable claims. The gate took the fast path with zero model calls.</span>}
        </div>
      </div>

      <details className="card p-5">
        <summary className="cursor-pointer select-none text-sm font-semibold">All verifications <span className="font-normal text-muted">({r.verifications?.length ?? 0})</span></summary>
        <div className="mt-3"><Table rows={r.verifications ?? []} empty="None." /></div>
      </details>

      <div className="card p-5 text-xs text-ink-2">
        <div className="label">Audit</div>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <div>needsFactCheck <span className="mono">{String(r.audit?.needsFactCheck)}</span></div>
          <div>provenance <span className="mono">{r.audit?.provenance}</span></div>
          <div>judgeUsed <span className="mono">{String(r.audit?.judgeUsed)}</span></div>
          <div>schema <span className="mono">{r.audit?.schemaVersion}</span></div>
          {r.audit?.fetchError && <div className="text-bad sm:col-span-2">fetchError <span className="mono">{r.audit.fetchError}</span></div>}
          {r.audit?.judgeNotes && <div className="sm:col-span-2">notes: {r.audit.judgeNotes}</div>}
        </div>
        <button type="button" onClick={() => setShowRaw((s) => !s)} className="mt-3 text-xs font-medium text-accent hover:underline">
          {showRaw ? "Hide" : "Show"} raw response
        </button>
        {showRaw && <pre className="mono mt-2 max-h-96 overflow-auto rounded-xl border border-line bg-white p-3 text-[11px] leading-relaxed text-ink">{JSON.stringify(r, null, 2)}</pre>}
      </div>
    </div>
  );
}
