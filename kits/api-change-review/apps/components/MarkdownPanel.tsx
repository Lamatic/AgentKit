"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Tab = { id: string; label: string; content: string | null };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-edge bg-panel-2 px-2.5 py-1.5 text-xs font-medium transition hover:border-slate-500"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function MarkdownPanel({ tabs }: { tabs: Tab[] }) {
  const available = tabs.filter((t) => t.content && t.content.trim());
  const [active, setActive] = useState(0);

  if (!available.length) return null;

  const current = available[Math.min(active, available.length - 1)];

  return (
    <section className="overflow-hidden rounded-xl border border-edge bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-edge px-2 py-2">
        <div className="flex gap-1">
          {available.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                current.id === t.id
                  ? "bg-panel-2 text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="pr-2">
          <CopyButton text={current.content ?? ""} />
        </div>
      </div>
      <div className="md max-h-[32rem] overflow-y-auto p-5 text-sm leading-relaxed">
        <ReactMarkdown>{current.content ?? ""}</ReactMarkdown>
      </div>
    </section>
  );
}
