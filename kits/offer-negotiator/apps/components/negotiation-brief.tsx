"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { NegotiationResult } from "@/lib/types";
import { Button } from "@/components/ui/button";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button type="button" variant="ghost" onClick={copy} aria-live="polite">
      {copied ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}

function Panel({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <section
      className="rise space-y-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="section-label">{title}</div>
      {children}
    </section>
  );
}

export function NegotiationBrief({ result }: { result: NegotiationResult }) {
  const {
    assessment,
    leverage,
    strategy,
    talking_points,
    counter_email,
    call_script,
    risks,
    assumptions,
  } = result;

  return (
    <div className="space-y-10">
      <Panel title="The read" delay={0}>
        <p className="text-lg leading-relaxed" style={{ color: "var(--ink)" }}>
          {assessment}
        </p>
      </Panel>

      <Panel title="Your ask" delay={60}>
        <div className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="eyebrow">Target base</p>
            <p className="ask-figure mt-2">{strategy?.target_base || "—"}</p>
            <div className="ask-underline" />
          </div>
          <div>
            <p className="eyebrow">Target total</p>
            <p className="ask-figure mt-2">{strategy?.target_total || "—"}</p>
            <div className="ask-underline" />
          </div>
          {strategy?.summary ? (
            <p
              className="sm:col-span-2 text-base leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              {strategy.summary}
            </p>
          ) : null}
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="What you've got" delay={120}>
          <ul className="list-marked pos">
            {leverage?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Watch-outs" delay={160}>
          <ul className="list-marked neg">
            {risks?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Panel>
      </div>

      {strategy?.approach ? (
        <Panel title="How to play it" delay={200}>
          <p className="leading-relaxed" style={{ color: "var(--ink)" }}>
            {strategy.approach}
          </p>
        </Panel>
      ) : null}

      {talking_points?.length ? (
        <Panel title="Say this" delay={240}>
          <ul className="list-marked pos">
            {talking_points.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Your counter-offer" delay={300}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Ready to send — edit the brackets before you do.
          </p>
          <CopyButton text={counter_email} label="Copy email" />
        </div>
        <div className="letter">{counter_email}</div>
      </Panel>

      {call_script ? (
        <Panel title="On the call" delay={340}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              A short script to keep you steady.
            </p>
            <CopyButton text={call_script} label="Copy script" />
          </div>
          <div className="letter">{call_script}</div>
        </Panel>
      ) : null}

      {assumptions?.length ? (
        <section
          className="rise pt-2"
          style={{ animationDelay: "380ms", borderTop: "1px solid var(--line)" }}
        >
          <p className="eyebrow mt-6">Assumptions behind this</p>
          <ul className="mt-3 space-y-1.5">
            {assumptions.map((item, i) => (
              <li
                key={i}
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
