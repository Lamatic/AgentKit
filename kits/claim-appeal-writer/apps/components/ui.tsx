"use client";

import type { ReactNode } from "react";

/** Surface container used for every panel in the wizard. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border p-5 ${className}`} style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
      {children}
    </div>
  );
}

/** Primary/ghost button. */
export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button"
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  const base = "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  const style =
    variant === "primary"
      ? { background: "var(--accent)", color: "#fff" }
      : { background: "transparent", color: "var(--accent)", border: "1px solid var(--line)" };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base} style={style}>
      {children}
    </button>
  );
}

/** Small status pill, tone-coded for confidence and deadline urgency. */
export function Badge({ tone, children }: { tone: "ok" | "warn" | "danger" | "neutral"; children: ReactNode }) {
  const map = {
    ok: { bg: "var(--ok-soft)", fg: "var(--ok)" },
    warn: { bg: "var(--warn-soft)", fg: "var(--warn)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
    neutral: { bg: "var(--accent-soft)", fg: "var(--accent)" }
  }[tone];
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: map.bg, color: map.fg }}>
      {children}
    </span>
  );
}

/** Uppercase field label. */
export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>{children}</label>;
}

/** Three-step progress indicator for the upload → confirm → appeal flow. */
export function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Upload documents", "Confirm the facts", "Your appeal"];
  return (
    <ol className="mb-8 flex items-center gap-3 text-sm">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = n === step;
        const done = n < step;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                background: active || done ? "var(--accent)" : "var(--line)",
                color: active || done ? "#fff" : "var(--muted)"
              }}
            >
              {done ? "✓" : n}
            </span>
            <span style={{ color: active ? "var(--ink)" : "var(--muted)", fontWeight: active ? 600 : 400 }}>{label}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-8" style={{ background: "var(--line)" }} />}
          </li>
        );
      })}
    </ol>
  );
}
