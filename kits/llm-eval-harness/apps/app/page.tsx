"use client"

import { useState } from "react"
import { FlaskConical, Loader2, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GateBanner } from "@/components/gate-banner"
import { ResultsTable } from "@/components/results-table"
import { runEvaluation } from "@/actions/orchestrate"
import { SAMPLE_GOLDEN_SET, SAMPLE_SYSTEM_PROMPT } from "@/lib/eval"
import type { GoldenCase, RunAggregate } from "@/lib/types"

export default function EvalHarnessPage() {
  const [systemPrompt, setSystemPrompt] = useState("")
  const [goldenSet, setGoldenSet] = useState("")
  const [threshold, setThreshold] = useState(90)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RunAggregate | null>(null)
  const [error, setError] = useState("")

  const loadExample = () => {
    setSystemPrompt(SAMPLE_SYSTEM_PROMPT)
    setGoldenSet(JSON.stringify(SAMPLE_GOLDEN_SET, null, 2))
    setError("")
  }

  const handleRun = async () => {
    setError("")

    if (!systemPrompt.trim()) {
      setError("Enter a system prompt to evaluate.")
      return
    }

    let cases: GoldenCase[]
    try {
      const parsed: unknown = JSON.parse(goldenSet)
      if (!Array.isArray(parsed)) throw new Error("Golden set must be a JSON array.")
      for (const item of parsed) {
        if (!item || typeof item.input !== "string" || typeof item.criteria !== "string") {
          throw new Error('Each case needs at least "input" and "criteria" string fields.')
        }
      }
      cases = parsed as GoldenCase[]
    } catch (e) {
      setError(e instanceof Error ? e.message : "Golden set is not valid JSON.")
      return
    }

    setIsLoading(true)
    setResult(null)
    try {
      const res = await runEvaluation(systemPrompt, cases, threshold)
      if (res.success && res.data) {
        setResult(res.data)
      } else {
        setError(res.error || "Evaluation failed.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">LLM Eval Harness</h1>
            <p className="text-xs text-muted-foreground">
              Score a prompt against a golden set with an LLM-as-judge · powered by Lamatic
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[400px_1fr]">
        {/* Configuration */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System prompt under test</CardTitle>
              <CardDescription>The prompt whose output quality you want to measure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="You are a support agent for…"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[120px] resize-y"
                disabled={isLoading}
              />

              <div className="space-y-2">
                <Label htmlFor="golden-set">Golden set (JSON)</Label>
                <Textarea
                  id="golden-set"
                  placeholder='[{ "input": "…", "criteria": "…", "reference": "…" }]'
                  value={goldenSet}
                  onChange={(e) => setGoldenSet(e.target.value)}
                  className="min-h-[220px] resize-y font-mono text-xs"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Gate threshold (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min={0}
                    max={100}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-24"
                    disabled={isLoading}
                  />
                </div>
                <Button type="button" variant="outline" onClick={loadExample} disabled={isLoading} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Load example
                </Button>
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button onClick={handleRun} disabled={isLoading} className="w-full gap-2">
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
            </CardContent>
          </Card>
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
            <Card className="flex h-full min-h-[400px] items-center justify-center border-dashed">
              <div className="max-w-sm px-6 text-center text-muted-foreground">
                <FlaskConical className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-medium text-foreground">No evaluation yet</p>
                <p className="mt-1 text-sm">
                  Add a system prompt and a golden set, then run the harness. Tip: click{" "}
                  <span className="font-medium">Load example</span> to try a support-agent prompt.
                </p>
              </div>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}
