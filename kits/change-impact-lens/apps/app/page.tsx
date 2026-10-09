"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, GitBranch, Home, Sparkles } from "lucide-react"
import { analyzeChangeImpact } from "@/actions/orchestrate"
import { Header } from "@/components/header"

type DependentResult = { file: string; hops: number }
type AnalysisData = {
  targetFile: string
  maxHops: number
  dependents: DependentResult[]
  explanation?: string
}

export default function ChangeImpactPage() {
  const [targetFile, setTargetFile] = useState("")
  const [maxHops, setMaxHops] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AnalysisData | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!targetFile.trim()) {
      setError("Please enter a file path, e.g. lib/utils.ts")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await analyzeChangeImpact(targetFile.trim(), maxHops)

      if (response.success && response.data) {
        setResult(response.data)
      } else {
        setError(response.error || "Analysis failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setTargetFile("")
    setError("")
  }

  // Group results by hop distance so the UI reads as "ripples outward"
  // rather than one flat list — this mirrors the BFS logic itself.
  const groupedByHops = result
    ? result.dependents.reduce<Record<number, string[]>>((acc, d) => {
        acc[d.hops] = acc[d.hops] || []
        acc[d.hops].push(d.file)
        return acc
      }, {})
    : {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-foreground">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        {!result && (
          <div className="flex items-start justify-center pt-12">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-normal mb-4 text-balance">Change Impact Lens</h1>
                <p className="text-xl text-muted-foreground">
                  See what could break, directly or indirectly, before you change a file
                </p>
              </div>

              <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="targetFile" className="text-sm font-medium">
                      File path (relative to this project)
                    </label>
                    <Input
                      id="targetFile"
                      placeholder="e.g. lib/utils.ts"
                      value={targetFile}
                      onChange={(e) => setTargetFile(e.target.value)}
                      className="h-12"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="maxHops" className="text-sm font-medium">
                      Max hops to trace (indirect impact depth)
                    </label>
                    <Input
                      id="maxHops"
                      type="number"
                      min={1}
                      max={10}
                      value={maxHops}
                      onChange={(e) => setMaxHops(Number(e.target.value) || 3)}
                      className="h-12 w-32"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!targetFile.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-4 h-4 mr-2" />
                        Analyze Impact
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start justify-center pt-12">
            <div className="max-w-3xl w-full">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-normal mb-2 text-balance">Impact of changing "{result.targetFile}"</h1>
                <p className="text-lg text-muted-foreground">
                  {result.dependents.length === 0
                    ? "No other files depend on this one, directly or indirectly."
                    : `${result.dependents.length} file(s) could be affected, up to ${result.maxHops} hops away.`}
                </p>
              </div>

              {result.explanation && (
                <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">AI Explanation</h2>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {result.explanation}
                  </div>
                </Card>
              )}

              <Card className="p-8 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
                {Object.keys(groupedByHops).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nothing else in this project imports this file.
                  </p>
                ) : (
                  <div className="space-y-6 mb-6">
                    {Object.keys(groupedByHops)
                      .map(Number)
                      .sort((a, b) => a - b)
                      .map((hop) => (
                        <div key={hop}>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                            {hop} hop{hop > 1 ? "s" : ""} away
                          </h3>
                          <ul className="space-y-1">
                            {groupedByHops[hop].map((file) => (
                              <li
                                key={file}
                                className="text-sm font-mono bg-muted/50 rounded px-3 py-2"
                              >
                                {file}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                )}

                <Button onClick={handleReset} variant="outline" className="w-full h-12 gap-2 bg-transparent">
                  <Home className="w-4 h-4" />
                  Analyze Another File
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}