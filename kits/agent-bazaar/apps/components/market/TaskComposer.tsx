"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  {
    label: "Market brief",
    goal: "Synthesize competitive analysis of agent orchestration protocols in Q1 2025. Deliver structured executive summary with latency benchmarks.",
    budget: 1200,
  },
  {
    label: "10-K risks",
    goal: "Extract and categorize all cyber and AI infrastructure disclosure risks from the latest Alphabet 10-K filing against SEC Item 1A.",
    budget: 900,
  },
  {
    label: "Product copy",
    goal: "Draft three high-converting launch email variants and social announcement cards for an automated devops agent platform.",
    budget: 700,
  },
];

interface TaskComposerProps {
  onSubmit: (goal: string, budget: number) => Promise<boolean>;
  autoplay: boolean;
  onAutoplayChange: (value: boolean) => void;
  error: string | null;
}

/** Render the task composer form. */
export function TaskComposer({
  onSubmit,
  autoplay,
  onAutoplayChange,
  error,
}: TaskComposerProps) {
  const [goal, setGoal] = useState(EXAMPLES[1].goal);
  const [budget, setBudget] = useState(35);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = goal.trim();
  const valid = trimmed.length >= 20 && trimmed.length <= 500 && budget > 0;

  /** handleSubmit helper. */
  async function handleSubmit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const ok = await onSubmit(trimmed, budget);
      if (ok) setGoal("");
    } finally {
      setSubmitting(false);
    }
  }

  /** handleKeyDown helper. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <section className="rounded-[10px] border border-hairline bg-card p-6 transition-all">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-semibold leading-tight text-neutral-900">Post a task</h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Submit requirements into the client agent escrow queue for worker bidding.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[12px] text-neutral-400">Templates:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => {
                setGoal(example.goal);
                setBudget(example.budget);
              }}
              className="rounded-full border border-hairline bg-subtle/50 px-2.5 py-1 text-[12px] text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-3">
        <textarea
          aria-label="Task description"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Describe the task for the bazaar…"
          className="w-full resize-none rounded-[6px] border border-hairline bg-canvas p-3 text-[14px] text-ink transition-all placeholder:text-faint focus:border-primary focus:bg-card focus:outline-none"
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="task-budget" className="text-[13px] font-medium text-neutral-700">
            Budget
          </label>
          <div className="relative flex items-center">
            <input
              id="task-budget"
              type="number"
              min={1}
              step={1}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
              className="w-24 rounded-[6px] border border-hairline bg-white px-2.5 py-1 pr-9 text-right font-mono text-[13px] text-neutral-900 focus:border-indigo-500 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-2.5 font-mono text-[11px] text-neutral-500">
              CRT
            </span>
          </div>
          <span className="text-[12px] text-neutral-500">escrowed from the client</span>
        </div>
        <div className="font-mono text-[12px] text-neutral-400">{trimmed.length}/500</div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onAutoplayChange(!autoplay)}
            className="flex cursor-pointer items-center gap-2"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                autoplay ? "bg-status-green dot-pulse" : "bg-neutral-400",
              )}
            />
            <span className="text-[13px] font-medium text-neutral-700">
              autoplay {autoplay ? "on" : "paused"}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!valid || submitting}
          className="flex items-center gap-1.5 rounded-[6px] bg-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{submitting ? "Posting…" : "Post & run"}</span>
          <span className="font-mono text-[11px] opacity-80">(⌘↵)</span>
        </button>
      </div>

      {error && (
        <p role="alert" className="pt-3 text-[12px] text-status-red">
          {error}
        </p>
      )}
    </section>
  );
}
