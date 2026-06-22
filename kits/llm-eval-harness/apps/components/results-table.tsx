"use client"

import { Fragment, useState } from "react"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CaseResult } from "@/lib/types"

function scoreColor(value: number): string {
  if (value >= 4) return "text-emerald-500"
  if (value >= 3) return "text-amber-500"
  return "text-red-500"
}

export function ResultsTable({ results }: { results: CaseResult[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-8" />
            <TableHead className="min-w-[200px]">Test input</TableHead>
            <TableHead className="text-center">Faith.</TableHead>
            <TableHead className="text-center">Rel.</TableHead>
            <TableHead className="text-center">Corr.</TableHead>
            <TableHead className="text-center">Overall</TableHead>
            <TableHead className="text-center">Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => {
            const isOpen = openIndex === index
            const judge = result.judge
            return (
              <Fragment key={result.case.id ?? index}>
                <TableRow className="cursor-pointer" onClick={() => setOpenIndex(isOpen ? null : index)}>
                  <TableCell>
                    <ChevronRight
                      className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-90")}
                    />
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate font-medium">{result.case.input}</TableCell>
                  {result.error || !judge ? (
                    <TableCell colSpan={5} className="text-center text-red-500">
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> error
                      </span>
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className={cn("text-center font-mono", scoreColor(judge.faithfulness))}>
                        {judge.faithfulness}
                      </TableCell>
                      <TableCell className={cn("text-center font-mono", scoreColor(judge.relevancy))}>
                        {judge.relevancy}
                      </TableCell>
                      <TableCell className={cn("text-center font-mono", scoreColor(judge.correctness))}>
                        {judge.correctness}
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold">{judge.overall}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={judge.pass ? "default" : "destructive"}
                          className={judge.pass ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                        >
                          {judge.pass ? "PASS" : "FAIL"}
                        </Badge>
                      </TableCell>
                    </>
                  )}
                </TableRow>
                {isOpen && (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell />
                    <TableCell colSpan={6} className="space-y-3 py-4 whitespace-normal">
                      <div>
                        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Generated output</div>
                        <p className="text-sm">
                          {result.error ? <span className="text-red-500">{result.error}</span> : result.output}
                        </p>
                      </div>
                      {judge && (
                        <div>
                          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Judge reasoning</div>
                          <p className="text-sm text-muted-foreground">{judge.reasoning}</p>
                        </div>
                      )}
                      <div>
                        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Criteria</div>
                        <p className="text-sm text-muted-foreground">{result.case.criteria}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
