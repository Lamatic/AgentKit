"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, FlaskConical, Loader2, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GateBanner } from "@/components/gate-banner"
import { ResultsTable } from "@/components/results-table"
import { runEvaluation } from "@/actions/orchestrate"
import { SAMPLE_GOLDEN_SET, SAMPLE_SYSTEM_PROMPT } from "@/lib/eval"
import type { GoldenCase, RunAggregate } from "@/lib/types"

type Validation =
  | { state: "empty" }
  | { state: "valid"; count: number; cases: GoldenCase[] }
  | { state: "invalid"; message: string }

function validateGoldenSet(text: string): Validation {
  if (!text.trim()) return { state: "empty" }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { state: "invalid", message: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}` }
  }
  if (!Array.isArray(parsed)) return { state: "invalid", message: "Golden set must be a JSON array." }
  if (parsed.length === 0) return { state: "invalid", message: "Add at least one test case." }
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i]
    if (!item || typeof item.input !== "string" || typeof item.criteria !== "string") {
      return { state: "invalid", message: `Case ${i + 1} needs "input" and "criteria" string fields.` }
    }
  }
  return { state: "valid", count: parsed.length, cases: parsed as GoldenCase[] }
}

export default function EvalHarnessPage() {
  const [systemPrompt, setSystemPrompt] = useState("")
  const [goldenSet, setGoldenSet] = useState("")
  const [threshold, setThreshold] = useState(90)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RunAggregate | null>(null)
  const [runError, setRunError] = useState("")

  const validation = useMemo(() => validateGoldenSet(goldenSet), [goldenSet])
  const canRun = !isLoading && systemPrompt.trim().length > 0 && validation.state === "valid"

  const loadExample = () => {
    setSystemPrompt(SAMPLE_SYSTEM_PROMPT)
    setGoldenSet(JSON.stringify(SAMPLE_GOLDEN_SET, null, 2))
    setRunError("")
  }

  const handleRun = async () => {
    if (validation.state !== "valid" || !systemPrompt.trim()) return
    setRunError("")
    setIsLoading(true)
    setResult(null)
    try {
      const res = await runEvaluation(systemPrompt, validation.cases, threshold)
      if (res.success && res.data) setResult(res.data)
      else setRunError(res.error || "Evaluation failed.")
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Evaluation failed.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* ambient accent glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.18),transparent)]" />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold leading-tight">LLM Eval Harness</h1>
              <p className="text-xs text-muted-foreground">LLM-as-judge quality gate for prompts</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
            powered by Lamatic
          </span>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[400px_1fr]">
        {/* Configuration */}
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-2xl shadow-black/20">
            <h2 className="text-sm font-semibold">Configuration</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Define what to test and how to grade it.</p>

            <div className="mt-5 space-y-5">
              {/* System prompt */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">System prompt under test</Label>
                <Textarea
                  placeholder="You are a support agent for…"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[120px] max-h-[220px] resize-y overflow-y-auto [field-sizing:fixed] bg-black/20"
                  disabled={isLoading}
                />
              </div>

              {/* Golden set */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="golden-set" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Golden set (JSON)
                  </Label>
                  <GoldenStatus validation={validation} />
                </div>
                <Textarea
                  id="golden-set"
                  placeholder='[{ "input": "…", "criteria": "…", "reference": "…" }]'
                  value={goldenSet}
                  onChange={(e) => setGoldenSet(e.target.value)}
                  className={cnInput(validation)}
                  disabled={isLoading}
                  aria-invalid={validation.state === "invalid"}
                />
                {validation.state === "invalid" && (
                  <p className="flex items-start gap-1.5 text-xs text-rose-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {validation.message}
                  </p>
                )}
              </div>

              {/* Threshold + example */}
              <div className="flex items-end justify-between gap-3">
                <div className="space-y-2">
                  <Label htmlFor="threshold" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Gate threshold
                  </Label>
                  <div className="relative w-24">
                    <Input
                      id="threshold"
                      type="number"
                      min={0}
                      max={100}
                      value={threshold}
                      onChange={(e) => setThreshold(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="bg-black/20 pr-7"
                      disabled={isLoading}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Button type="button" variant="ghost" onClick={loadExample} disabled={isLoading} className="gap-2 text-muted-foreground hover:text-foreground">
                  <Sparkles className="h-4 w-4" />
                  Load example
                </Button>
              </div>

              {runError && (
                <p className="flex items-start gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {runError}
                </p>
              )}

              <Button
                onClick={handleRun}
                disabled={!canRun}
                className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-violet-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run evaluation
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="space-y-4">
          {result ? (
            <>
              <GateBanner
                gatePassed={result.gatePassed}
                passRate={result.passRate}
                threshold={result.threshold}
                passed={result.passed}
                total={result.total}
                avgOverall={result.avgOverall}
              />
              <ResultsTable results={result.results} />
            </>
          ) : (
            <div className="flex min-h-[460px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
              <div className="max-w-sm px-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <FlaskConical className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium">No evaluation yet</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Add a system prompt and a golden set, then run the harness — or click{" "}
                  <span className="font-medium text-foreground">Load example</span> to try a support-agent scenario.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function GoldenStatus({ validation }: { validation: Validation }) {
  if (validation.state === "valid") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {validation.count} case{validation.count === 1 ? "" : "s"} ready
      </span>
    )
  }
  if (validation.state === "invalid") {
    return <span className="text-xs text-rose-400">invalid</span>
  }
  return <span className="text-xs text-muted-foreground">array of cases</span>
}

function cnInput(validation: Validation): string {
  const base =
    "min-h-[220px] max-h-[360px] resize-y overflow-y-auto [field-sizing:fixed] bg-black/20 font-mono text-xs"
  return validation.state === "invalid" ? `${base} border-rose-500/40` : base
}
