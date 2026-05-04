"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Search, FileText, Github, Check, Loader2, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import { orchestratePipelineStep } from "@/actions/orchestrate"
import { ComparisonTable } from "@/components/ComparisonTable"
import type { JSX } from "react"

interface ComparisonRow {
  feature: string
  entity1Value: string | boolean | number
  entity2Value: string | boolean | number
  winner?: 1 | 2 | 0
}

interface ComparisonData {
  entity1: string
  entity2: string
  rows: ComparisonRow[]
  verdict: string
  differences: string
}

export default function ComparisonEngine() {
  const [entity1, setEntity1] = useState("")
  const [entity2, setEntity2] = useState("")
  const [criteria, setCriteria] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [comparisonResults, setComparisonResults] = useState<ComparisonData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const steps = [
    { id: "research_entity_1", label: "Researching Entity A" },
    { id: "research_entity_2", label: "Researching Entity B" },
    { id: "compare_entities", label: "Analyzing Differences" },
    { id: "final_verdict", label: "Generating Verdict" },
  ]

  const handleCompare = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!entity1.trim() || !entity2.trim()) return

    setIsLoading(true)
    setError(null)
    setComparisonResults(null)
    const results: Record<string, any> = {}

    try {
      // Step 1: Research Entity A
      setCurrentStep("research_entity_1")
      const resA = await orchestratePipelineStep(`${entity1} ${criteria}`, [], "research_entity_1")
      if (!resA.success) throw new Error(resA.error)
      results.research_entity_1 = resA.data

      // Step 2: Research Entity B
      setCurrentStep("research_entity_2")
      const resB = await orchestratePipelineStep(`${entity2} ${criteria}`, [], "research_entity_2")
      if (!resB.success) throw new Error(resB.error)
      results.research_entity_2 = resB.data

      // Step 3: Compare
      setCurrentStep("compare_entities")
      const resCompare = await orchestratePipelineStep(criteria, [], "compare_entities", {
        research_a: results.research_entity_1.research,
        research_b: results.research_entity_2.research,
        criteria
      })
      if (!resCompare.success) throw new Error(resCompare.error)
      results.compare_entities = resCompare.data

      // Step 4: Verdict
      setCurrentStep("final_verdict")
      const resVerdict = await orchestratePipelineStep(criteria, [], "final_verdict", {
        comparison_data: results.compare_entities.comparison_table,
        criteria
      })
      if (!resVerdict.success) throw new Error(resVerdict.error)
      
      setComparisonResults({
        entity1,
        entity2,
        rows: results.compare_entities.comparison_table.rows || [],
        verdict: resVerdict.data.verdict,
        differences: results.compare_entities.differences
      })
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An error occurred during comparison")
    } finally {
      setIsLoading(false)
      setCurrentStep(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform rotate-12">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Agent Kit <span className="text-primary">Comparison</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Link href="https://lamatic.ai/docs" target="_blank" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <FileText className="h-4 w-4" /> Docs
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {!comparisonResults && (
           <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Compare Anything with AI</h2>
           <p className="text-xl text-muted-foreground">Deep research and structured analysis across any two entities</p>
         </div>
        )}

        <Card className="p-8 mb-12 shadow-xl border-border/50 bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleCompare} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Entity A</label>
                <Input 
                  placeholder="e.g. iPhone 16 Pro" 
                  value={entity1} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntity1(e.target.value)}
                  className="h-14 text-lg border-2 focus:ring-primary/20"
                  disabled={isLoading}
                />
              </div>
              
              <div className="hidden md:flex absolute left-1/2 -ml-6 w-12 h-12 rounded-full bg-muted items-center justify-center border-4 border-background z-10">
                <span className="text-xs font-bold text-muted-foreground">VS</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Entity B</label>
                <Input 
                  placeholder="e.g. Samsung S24 Ultra" 
                  value={entity2} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntity2(e.target.value)}
                  className="h-14 text-lg border-2 focus:ring-primary/20"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Comparison Criteria (Optional)</label>
              <Input 
                placeholder="e.g. Battery life, Camera, Performance, Price" 
                value={criteria} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCriteria(e.target.value)}
                className="h-14 text-lg border-2 focus:ring-primary/20"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" 
              disabled={isLoading || !entity1 || !entity2}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Orchestrating Agents...
                </>
              ) : (
                "Run Ultimate Comparison"
              )}
            </Button>
          </form>
        </Card>

        {isLoading && (
          <div className="space-y-4 max-w-md mx-auto animate-in fade-in duration-500">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                  currentStep === step.id 
                    ? "bg-primary/5 border-primary shadow-sm" 
                    : steps.indexOf(steps.find(s => s.id === currentStep)!) > steps.indexOf(step)
                      ? "bg-muted/30 border-border opacity-60"
                      : "bg-background border-border text-muted-foreground opacity-40"
                }`}
              >
                {currentStep === step.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : steps.indexOf(steps.find(s => s.id === currentStep)!) > steps.indexOf(step) ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2" />
                )}
                <span className="font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center font-medium">
            Error: {error}
          </div>
        )}

        {comparisonResults && (
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <section className="space-y-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                Side-by-Side Analysis
              </h3>
              <ComparisonTable 
                entity1Name={comparisonResults.entity1} 
                entity2Name={comparisonResults.entity2} 
                rows={comparisonResults.rows} 
              />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-2xl font-bold">Key Differences</h3>
                <Card className="p-6 prose dark:prose-invert max-w-none bg-muted/20 border-border/40">
                  <ReactMarkdown>{comparisonResults.differences}</ReactMarkdown>
                </Card>
              </section>

              <section className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                  Expert Verdict
                </h3>
                <Card className="p-6 bg-primary/5 border-primary/20 prose dark:prose-invert max-w-none shadow-inner">
                  <ReactMarkdown>{comparisonResults.verdict}</ReactMarkdown>
                </Card>
              </section>
            </div>

            <div className="flex justify-center pb-12">
              <Button variant="outline" onClick={() => setComparisonResults(null)} className="gap-2">
                Start New Comparison
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Lamatic AI Comparison Kit • Powered by AgentKit Framework</p>
      </footer>
    </div>
  )
}
