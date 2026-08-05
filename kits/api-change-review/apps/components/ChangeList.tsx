"use client";

import { useState } from "react";
import type { ReviewedChange, Severity } from "../lib/types";

const GROUPS: { key: Severity; label: string; tone: string; openByDefault: boolean }[] = [
  { key: "breaking", label: "Breaking", tone: "text-severity-breaking", openByDefault: true },
  {
    key: "potentially-breaking",
    label: "Potentially breaking",
    tone: "text-severity-maybe",
    openByDefault: true,
  },
  { key: "unclassified", label: "Unclassified", tone: "text-severity-unknown", openByDefault: true },
  // Additive changes are noise when you are scanning for what breaks.
  { key: "additive", label: "Additive", tone: "text-severity-additive", openByDefault: false },
];

const KNOWN = new Set<string>(["breaking", "potentially-breaking", "additive"]);

/** Grouping is presentation, not policy — tolerate whatever casing arrives. */
function sev(c: ReviewedChange): string {
  return String(c.severity ?? "").toLowerCase().trim().replace(/\s+/g, "-");
}

function render(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function ChangeRow({ change }: { change: ReviewedChange }) {
  return (
    <li className="border-t border-edge px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <code className="text-sm font-medium">{change.location}</code>
        <span className="rounded border border-edge bg-panel-2 px-1.5 py-0.5 text-[11px] text-muted">
          {change.kind}
        </span>
        {typeof change.confidence === "number" ? (
          <span className="text-[11px] text-muted">
            {Math.round(change.confidence * 100)}% confidence
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <code className="max-w-full truncate rounded bg-panel-2 px-1.5 py-0.5 text-muted">
          {render(change.before)}
        </code>
        <span className="text-muted">→</span>
        <code className="max-w-full truncate rounded bg-panel-2 px-1.5 py-0.5 text-ink">
          {render(change.after)}
        </code>
      </div>

      {change.reason ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{change.reason}</p>
      ) : null}
      {change.consumerImpact ? (
        <p className="mt-1 text-sm leading-relaxed">
          <span className="text-muted">Consumer impact: </span>
          {change.consumerImpact}
        </p>
      ) : null}
    </li>
  );
}

function Group({
  label,
  tone,
  changes,
  openByDefault,
}: {
  label: string;
  tone: string;
  changes: ReviewedChange[];
  openByDefault: boolean;
}) {
  const [open, setOpen] = useState(openByDefault);

  return (
    <section className="overflow-hidden rounded-xl border border-edge bg-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-panel-2"
      >
        <span className={`text-sm font-semibold ${tone}`}>
          {label}
          <span className="ml-2 text-muted">{changes.length}</span>
        </span>
        <span className="text-xs text-muted">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <ul className="border-t border-edge">
          {changes.map((c) => (
            <ChangeRow key={c.id} change={c} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function ChangeList({ changes }: { changes: ReviewedChange[] }) {
  if (!changes?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {GROUPS.map((g) => {
        // "unclassified" also catches any severity the model invents, so no
        // change can silently disappear from the list.
        const inGroup =
          g.key === "unclassified"
            ? changes.filter((c) => !KNOWN.has(sev(c)))
            : changes.filter((c) => sev(c) === g.key);
        if (!inGroup.length) return null;
        return (
          <Group
            key={g.key}
            label={g.label}
            tone={g.tone}
            changes={inGroup}
            openByDefault={g.openByDefault}
          />
        );
      })}
    </div>
  );
}
