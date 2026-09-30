"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, CalendarClock, Check, Copy, Download, ExternalLink, ListChecks, Quote, RotateCcw } from "lucide-react";
import { Badge, Button, Card } from "./ui";
import type { AppealResult } from "@/lib/types";

/**
 * Step 3 of the wizard: the finished appeal.
 *
 * Shows the letter alongside the exact policy excerpts it quoted, so every
 * citation can be checked against the source. The deadline banner is labelled
 * with where the date came from (letter, regulation, or unknown) rather than
 * presenting a computed date as fact.
 */

/**
 * PDF text extraction preserves the source document's column width, so excerpts
 * arrive with a hard line break every ~78 characters. Rejoin those breaks into
 * flowing paragraphs while keeping genuine blank-line paragraph breaks, and drop
 * the markdown bold markers that would otherwise render literally.
 */
function reflow(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .split(/\n{2,}/)
    .map((para) => para.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function AppealStep({ result, onBack, onRestart }: { result: AppealResult; onBack: () => void; onRestart: () => void }) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"citations" | "sources">("citations");

  async function copy() {
    await navigator.clipboard.writeText(result.letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  function download() {
    const blob = new Blob([result.letter], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "appeal-letter.md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const d = result.deadline;
  const deadlineTone = d.source === "unknown" ? "warn" : "danger";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border p-4" style={{ borderColor: "var(--line)", background: d.source === "unknown" ? "var(--warn-soft)" : "var(--danger-soft)" }}>
        <CalendarClock size={18} style={{ color: d.source === "unknown" ? "var(--warn)" : "var(--danger)" }} />
        <div className="flex-1 text-sm">
          <span className="font-semibold">Appeal deadline: </span>
          {d.date ?? "not stated in your documents"}
          <span className="ml-2"><Badge tone={deadlineTone}>source: {d.source}</Badge></span>
          <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{d.urgencyNote}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium">Your appeal letter</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</Button>
                <Button variant="ghost" onClick={download}><Download size={14} /> Download</Button>
              </div>
            </div>
            <div className="letter rounded-lg border p-6" style={{ borderColor: "var(--line)" }}>
              <ReactMarkdown>{result.letter}</ReactMarkdown>
            </div>
            <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>{result.disclaimer}</p>
          </Card>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}><ArrowLeft size={16} /> Edit facts</Button>
            <Button variant="ghost" onClick={onRestart}><RotateCcw size={16} /> Start over</Button>
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2 font-medium"><ListChecks size={16} /> Evidence to attach</div>
            <ul className="space-y-2 text-sm">
              {result.checklist.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <div className="font-medium">{c.item} {c.required && <Badge tone="neutral">required</Badge>}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{c.why}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-2 font-medium">Next steps</div>
            <ol className="list-decimal space-y-1 pl-5 text-sm">{result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            {result.escalation && (
              <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: "var(--accent-soft)" }}>
                <span className="font-semibold">If the appeal is denied: </span>{result.escalation}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex gap-3 text-sm">
              <button onClick={() => setTab("citations")} className="font-medium" style={{ color: tab === "citations" ? "var(--accent)" : "var(--muted)" }}>
                <Quote size={14} className="mr-1 inline" />Policy excerpts ({result.policyExcerpts.length})
              </button>
              <button onClick={() => setTab("sources")} className="font-medium" style={{ color: tab === "sources" ? "var(--accent)" : "var(--muted)" }}>
                <ExternalLink size={14} className="mr-1 inline" />Regulatory sources ({result.webSources.length})
              </button>
            </div>
            {tab === "citations" ? (
              <div className="max-h-96 space-y-3 overflow-auto text-xs">
                {result.policyExcerpts.length === 0 && <div style={{ color: "var(--muted)" }}>No policy excerpts were retrieved. Rather than invent policy language, the letter asks the insurer to identify the provision it relied upon.</div>}
                {result.policyExcerpts.map((p, i) => (
                  <div key={i} className="rounded-lg border p-2" style={{ borderColor: "var(--line)" }}>
                    <div className="mb-1 font-semibold" style={{ color: "var(--accent)" }}>{p.label}{p.certainty != null && <span className="ml-2 font-normal" style={{ color: "var(--muted)" }}>relevance {Math.round(p.certainty * 100)}%</span>}</div>
                    <div className="whitespace-pre-wrap leading-relaxed">{reflow(p.content)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-96 space-y-3 overflow-auto text-xs">
                {result.webSources.length === 0 && <div style={{ color: "var(--muted)" }}>No regulatory sources were retrieved for this run, so the letter cites your policy only and makes no claims about statutory deadlines.</div>}
                {result.webSources.map((w, i) => (
                  <div key={i}>
                    <a href={w.url} target="_blank" rel="noreferrer" className="font-semibold underline-offset-2 hover:underline" style={{ color: "var(--accent)" }}>{w.title}</a>
                    <div style={{ color: "var(--muted)" }}>{w.snippet}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
