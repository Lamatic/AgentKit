"use client";

import { useState } from "react";
import type { Verification } from "../lib/gate";
import type { GateResponse } from "../lib/types";

const VERDICT: Record<string, { label: string; tone: string; hint: string }> = {
  allow: { label: "ALLOW", tone: "border-ok text-ok", hint: "Draft goes out unchanged." },
  rewrite: { label: "REWRITE", tone: "border-warn text-warn", hint: "Draft replaced by a re-verified rewrite." },
  block: { label: "BLOCK", tone: "border-bad text-bad", hint: "Nothing goes out. A human, or a better-grounded drafter, takes over." }
};

const STATUS_TONE: Record<string, string> = {
  verified: "bg-ok/15 text-ok",
  contradicted: "bg-bad/15 text-bad",
  unsupported: "bg-warn/15 text-warn",
  unverifiable: "bg-dim/20 text-dim"
};

function Pill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tone}`}>{children}</span>;
}

function VerificationTable({ rows, caption }: { rows: Verification[]; caption: string }) {
  if (!rows.length) return <p className="text-sm text-dim">{caption}: none.</p>;
  return (
    <div className="overflow-x-auto rounded border border-line">
      <table className="w-full text-left text-xs">
        <thead className="bg-panel-2 text-dim">
          <tr>
            <th className="px-2 py-1.5 font-medium">Claim</th>
            <th className="px-2 py-1.5 font-medium">Kind</th>
            <th className="px-2 py-1.5 font-medium">Evidence class</th>
            <th className="px-2 py-1.5 font-medium">Source</th>
            <th className="px-2 py-1.5 font-medium">Evidence</th>
            <th className="px-2 py-1.5 font-medium">Severity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v, i) => (
            <tr key={v.claimId + i} className="border-t border-line align-top">
              <td className="max-w-[16rem] px-2 py-1.5 font-mono">{v.token}</td>
              <td className="px-2 py-1.5">{v.kind}</td>
              <td className="px-2 py-1.5"><Pill tone={STATUS_TONE[v.status] ?? STATUS_TONE.unverifiable}>{v.status}</Pill></td>
              <td className="px-2 py-1.5">{v.source}</td>
              <td className="max-w-[20rem] px-2 py-1.5 font-mono text-dim">{v.evidence || v.message}</td>
              <td className="px-2 py-1.5">{v.severity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultPanel({ response, draft }: { response: GateResponse | null; draft: string }) {
  const [showRaw, setShowRaw] = useState(false);
  if (!response) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed border-line text-sm text-dim">
        Pick a scenario and run the gate.
      </div>
    );
  }
  if (!response.ok || !response.result) {
    return (
      <div className="rounded-lg border border-bad/50 bg-bad/10 p-4 text-sm">
        <div className="font-semibold text-bad">Gate did not run</div>
        <div className="mt-1 font-mono text-xs">{response.error}</div>
      </div>
    );
  }
  const r = response.result;
  const v = VERDICT[r.verdict] ?? VERDICT.block;
  const changed = r.finalMessage != null && r.finalMessage !== draft;

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border-2 bg-panel p-4 ${v.tone}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-2xl font-bold tracking-tight">{v.label}</div>
          <div className="text-xs text-dim">
            {response.mode === "flow" ? "deployed flow" : "local mode"} · {response.elapsedMs} ms · judge {r.audit?.judgeUsed ? "used" : "skipped"} · facts from {r.audit?.provenance === "tool" ? "truth_url" : "caller"}
          </div>
        </div>
        <div className="mt-1 text-sm text-text">{v.hint}</div>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-dim">Draft (as written by the agent)</div>
          <p className={`whitespace-pre-wrap text-sm ${changed || r.finalMessage == null ? "text-dim line-through decoration-bad/60" : ""}`}>{draft}</p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-dim">What actually gets sent</div>
          {r.finalMessage == null ? (
            <p className="text-sm text-bad">Nothing. {r.audit?.judgeNotes || ""}</p>
          ) : (
            <p className="whitespace-pre-wrap text-sm">{r.finalMessage}</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Findings ({r.findings?.length ?? 0})</h3>
        <VerificationTable rows={r.findings ?? []} caption="Findings" />
      </section>

      {r.rewriteCheck && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">
            Rewrite re-verified: <span className={r.rewriteCheck.preVerdict === "allow" ? "text-ok" : "text-bad"}>{r.rewriteCheck.preVerdict}</span>
          </h3>
          <VerificationTable rows={r.rewriteCheck.findings ?? []} caption="Rewrite findings" />
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">
          Claims JSON · risk <span className="font-mono">{r.claims?.risk}</span> · {r.claims?.figures?.length ?? 0} figures · {r.claims?.statements?.length ?? 0} statements
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(r.claims?.figures ?? []).map((f) => (
            <span key={f.id} className="rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-xs">
              <span className="text-dim">{f.kind}</span> {f.token}
            </span>
          ))}
          {(r.claims?.statements ?? []).map((s) => (
            <span key={s.id} className="rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-xs">
              <span className="text-dim">{s.rule}</span> “{s.text}” <span className="text-dim">→ {s.never ? "forbidden" : s.factPath}</span>
            </span>
          ))}
          {!r.claims?.figures?.length && !r.claims?.statements?.length && <span className="text-xs text-dim">No verifiable claims: the gate took the fast path.</span>}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">All verifications ({r.verifications?.length ?? 0})</h3>
        <VerificationTable rows={r.verifications ?? []} caption="Verifications" />
      </section>

      <section className="rounded-lg border border-line bg-panel p-3 text-xs">
        <div className="mb-1 font-semibold uppercase tracking-wide text-dim">Audit</div>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <div>needsFactCheck: <span className="font-mono">{String(r.audit?.needsFactCheck)}</span></div>
          <div>provenance: <span className="font-mono">{r.audit?.provenance}</span></div>
          <div>judgeUsed: <span className="font-mono">{String(r.audit?.judgeUsed)}</span></div>
          <div>schema: <span className="font-mono">{r.audit?.schemaVersion}</span></div>
          {r.audit?.fetchError && <div className="sm:col-span-2 text-bad">fetchError: <span className="font-mono">{r.audit.fetchError}</span></div>}
          {r.audit?.judgeNotes && <div className="sm:col-span-2">notes: {r.audit.judgeNotes}</div>}
        </div>
      </section>

      <button type="button" onClick={() => setShowRaw((s) => !s)} className="text-xs text-accent underline-offset-2 hover:underline">
        {showRaw ? "Hide" : "Show"} raw response JSON
      </button>
      {showRaw && <pre className="max-h-96 overflow-auto rounded border border-line bg-panel p-3 font-mono text-[11px] leading-relaxed">{JSON.stringify(r, null, 2)}</pre>}
    </div>
  );
}
