"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Loader2,
  Sparkles,
  FileText,
  Copy,
  Check,
  Home,
  ExternalLink,
  RefreshCw,
  Zap,
  Layout,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react"
import { runBlogAutomation, type BlogAutomationResult } from "@/actions/orchestrate"
import ReactMarkdown from "react-markdown"
import { Header } from "@/components/header"

export default function BlogAutomationPage() {
  const [topic, setTopic] = useState("")
  const [keywords, setKeywords] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"idle" | "drafting" | "seo" | "publishing">("idle")
  const [result, setResult] = useState<BlogAutomationResult | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topic.trim()) {
      setError("Please provide a topic")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)
    setCopied(false)
    setStep("drafting")

    try {
      // Small artificial delays to show the step-by-step nature of the automation
      // only if not in MOCK MODE which already has a delay
      const response = await runBlogAutomation(topic, keywords, instructions)

      if (response.success) {
        setResult(response)
      } else {
        setError(response.error || "Automation failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
      setStep("idle")
    }
  }

  const handleReset = () => {
    setResult(null)
    setTopic("")
    setKeywords("")
    setInstructions("")
    setError("")
    setCopied(false)
  }

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-rose-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]"></div>
      </div>

      <Header />

      <main className="px-6 py-12 max-w-6xl mx-auto space-y-12">
        {!result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold tracking-wider uppercase mb-2">
                <Zap className="w-3 h-3" />
                Next-Gen Content Pipeline
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-400">
                Craft Your Story. <br />
                <span className="text-rose-500">Automatically.</span>
              </h1>
              <p className="max-w-xl mx-auto text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Transform a single topic into a fully optimized, ready-to-publish blog post in seconds using multi-agent intelligence.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto p-8 border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-300">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="topic" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-rose-500" />
                      Blog Topic or Primary Title
                    </label>
                    <Input
                      id="topic"
                      placeholder="e.g. The Impact of Edge Computing on Web Performance"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-rose-500 transition-all text-base px-4 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="keywords" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Search className="w-4 h-4 text-rose-500" />
                      Target SEO Keywords
                    </label>
                    <Input
                      id="keywords"
                      placeholder="e.g. edge nodes, latency reduction, distributed systems"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-rose-500 transition-all text-base px-4 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="instructions" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      Stylistic Instructions
                    </label>
                    <Textarea
                      id="instructions"
                      placeholder="e.g. Write in a storytelling tone, include a technical deep-dive section, and use bold styling for key terms."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="min-h-[120px] bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-rose-500 transition-all text-base p-4 rounded-xl resize-none"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-xl animate-in shake duration-300">
                    <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
                  </div>
                )}

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 invisible group-hover:visible"></div>
                  <Button
                    type="submit"
                    className="relative w-full h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-lg font-bold shadow-xl shadow-rose-500/20 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden"
                    disabled={!topic.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="animate-pulse">
                          {step === "drafting" ? "AI Drafting..." : step === "seo" ? "SEO Optimizing..." : "Publishing Content..."}
                        </span>
                      </>
                    ) : (
                      <>
                        Automate Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {result && (
          <div className="animate-in fade-in grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pb-12">
            <div className="lg:col-span-12 text-center mb-4 space-y-2">
              <h2 className="text-4xl font-black tracking-tight">Post Published.</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Your content has traveled through the intelligence pipeline.</p>
            </div>

            <Card className="lg:col-span-8 p-0 overflow-hidden border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Optimized Content</h3>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(result.optimizedContent || "")}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 font-bold gap-2 active:scale-95 transition-transform"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Markdown
                    </>
                  )}
                </Button>
              </div>
              <div className="p-8 max-h-[700px] overflow-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-rose max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:rounded-2xl">
                <ReactMarkdown>{result.optimizedContent || ""}</ReactMarkdown>
              </div>
            </Card>

            <div className="lg:col-span-4 space-y-8">
              <Card className="p-8 border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl space-y-8">
                <h3 className="text-xl font-bold border-b border-slate-200/50 dark:border-slate-800/50 pb-4">Execution Summary</h3>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex-shrink-0 flex items-center justify-center text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Drafting Flow</h4>
                      <p className="text-xs text-slate-500 font-medium">Successfully generated base content</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex-shrink-0 flex items-center justify-center text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">SEO Flow</h4>
                      <p className="text-xs text-slate-500 font-medium">Optimized for search engine visibility</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex-shrink-0 flex items-center justify-center text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">CMS Publishing</h4>
                      <p className="text-xs text-slate-500 font-medium">Live sync completed successfully</p>
                    </div>
                  </div>
                </div>

                {result.url && (
                  <div className="p-6 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-3">
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Live Platform URL</p>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold flex items-center gap-2 hover:text-rose-500 transition-colors break-all leading-tight"
                      >
                        {result.url} <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-rose-500/5 group-hover:scale-150 transition-transform duration-500"></div>
                  </div>
                )}

                <div className="pt-4 space-y-4">
                  <Button onClick={handleReset} variant="outline" className="w-full h-14 rounded-2xl border-slate-200/50 dark:border-slate-800/50 text-base font-bold gap-3 active:scale-[0.98] transition-transform">
                    <RefreshCw className="w-5 h-5" />
                    Run Another Task
                  </Button>
                  <Button
                    asChild
                    className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-base font-black shadow-xl transition-all duration-300 active:scale-[0.98] group"
                    disabled={!result.url}
                  >
                    <a href={result.url || "#"} target="_blank" rel="noreferrer">
                      View Live Post
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </Card>

              <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/30 flex items-center gap-4 border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold">Last Execution</p>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
