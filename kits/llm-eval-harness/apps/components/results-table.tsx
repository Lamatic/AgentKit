"use client"

import { Fragment, type ReactNode, useEffect, useState } from "react"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CaseResult } from "@/lib/types"

function ScoreChip({ value }: { value: number }) {
  const tint =
    value >= 4
      ? "bg-emerald-500/15 text-emerald-400"
      : value >= 3
        ? "bg-amber-500/15 text-amber-400"
        : "bg-rose-500/15 text-rose-400"
  return (
    <span className={cn("inline-flex h-7 w-8 items-center justify-center rounded-md font-mono text-sm font-semibold", tint)}>
      {value}
    </span>
  )
}

export function ResultsTable({ results }: { results: CaseResult[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Auto-open the first failed (or errored) case; if everything passes, stay collapsed.
  useEffect(() => {
    const firstFail = results.findIndex((r) => !r.judge || r.judge.pass === false)
    setOpenIndex(firstFail >= 0 ? firstFail : null)
  }, [results])

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>Test input</span>
        <span className="w-8 text-center">Fth</span>
        <span className="w-8 text-center">Rel</span>
        <span className="w-8 text-center">Cor</span>
        <span className="w-12 text-center">Overall</span>
        <span className="w-16 text-center">Result</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {results.map((result, index) => {
          const isOpen = openIndex === index
          const judge = result.judge
          const failed = !judge || judge.pass === false
          return (
            <Fragment key={`${result.case.id ?? "case"}-${index}`}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={`case-detail-${index}`}
                className="grid w-full grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ChevronRight
                    className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")}
                  />
                  <span className="truncate text-sm font-medium">{result.case.input}</span>
                </span>
                {result.error || !judge ? (
                  <span className="col-span-4 flex items-center justify-center gap-1 text-xs text-rose-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> error
                  </span>
                ) : (
                  <>
                    <span className="flex w-8 justify-center"><ScoreChip value={judge.faithfulness} /></span>
                    <span className="flex w-8 justify-center"><ScoreChip value={judge.relevancy} /></span>
                    <span className="flex w-8 justify-center"><ScoreChip value={judge.correctness} /></span>
                    <span className="w-12 text-center font-mono text-sm font-semibold">{judge.overall}</span>
                  </>
                )}
                <span className="flex w-16 justify-center">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      failed ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400",
                    )}
                  >
                    {failed ? "FAIL" : "PASS"}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div id={`case-detail-${index}`} className="space-y-3 bg-black/20 px-4 py-4 pl-10">
                  <Detail label="Generated output">
                    {result.error ? <span className="text-rose-400">{result.error}</span> : result.output}
                  </Detail>
                  {judge && <Detail label="Judge reasoning" muted>{judge.reasoning}</Detail>}
                  <Detail label="Criteria" muted>{result.case.criteria}</Detail>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

function Detail({ label, children, muted }: { label: string; children: ReactNode; muted?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <p className={cn("text-sm leading-relaxed", muted && "text-muted-foreground")}>{children}</p>
    </div>
  )
}
