"use client"

import { Fragment, type ReactNode, useEffect, useState } from "react"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttackResult, Severity } from "@/lib/types"

const CATEGORY_LABELS: Record<string, string> = {
  jailbreak: "Jailbreak",
  "prompt-injection": "Prompt injection",
  exfiltration: "Exfiltration",
  "instruction-override": "Instruction override",
  "pii-extraction": "PII extraction",
  "harmful-content": "Harmful content",
}

function SeverityChip({ severity }: { severity: Severity }) {
  const tint =
    severity === "critical" || severity === "high"
      ? "bg-rose-500/15 text-rose-400"
      : severity === "medium"
        ? "bg-amber-500/15 text-amber-400"
        : severity === "low"
          ? "bg-yellow-500/15 text-yellow-400"
          : "bg-emerald-500/15 text-emerald-400"
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold", tint)}>{severity}</span>
}

export function AttackResultsTable({ results }: { results: AttackResult[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Auto-open the first compromised (or errored) case; if everything held, stay collapsed.
  useEffect(() => {
    const firstFail = results.findIndex((r) => !r.judge || r.judge.pass === false)
    setOpenIndex(firstFail >= 0 ? firstFail : null)
  }, [results])

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="w-36">Category</span>
        <span>Technique</span>
        <span className="w-20 text-center">Severity</span>
        <span className="w-20 text-center">Result</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {results.map((result, index) => {
          const isOpen = openIndex === index
          const judge = result.judge
          const failed = !judge || judge.pass === false
          return (
            <Fragment key={`${result.case.id}-${index}`}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={`attack-detail-${index}`}
                className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span className="flex w-36 min-w-0 items-center gap-2">
                  <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                  <span className="truncate text-xs font-medium text-muted-foreground">{CATEGORY_LABELS[result.case.category] ?? result.case.category}</span>
                </span>
                <span className="truncate text-sm font-medium">{result.case.technique}</span>
                <span className="flex w-20 justify-center">
                  {result.error || !judge ? (
                    <span className="flex items-center gap-1 text-xs text-rose-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> error
                    </span>
                  ) : (
                    <SeverityChip severity={judge.severity} />
                  )}
                </span>
                <span className="flex w-20 justify-center">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      failed ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400",
                    )}
                  >
                    {failed ? "BROKE" : "HELD"}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div id={`attack-detail-${index}`} className="space-y-3 bg-black/20 px-4 py-4 pl-10">
                  <Detail label="What this tests">{result.case.description}</Detail>
                  <Detail label="Attack payload sent" mono>
                    {result.case.payload}
                  </Detail>
                  <Detail label="Agent's actual response">{result.error ? <span className="text-rose-400">{result.error}</span> : result.response}</Detail>
                  {judge && (
                    <Detail label="Judge reasoning" muted>
                      {judge.reasoning}
                    </Detail>
                  )}
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

function Detail({ label, children, muted, mono }: { label: string; children: ReactNode; muted?: boolean; mono?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", muted && "text-muted-foreground", mono && "font-mono text-xs")}>{children}</p>
    </div>
  )
}
