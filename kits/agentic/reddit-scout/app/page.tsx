"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Copy, Check, ArrowLeft, ArrowRight, MousePointerClick } from "lucide-react"
import { searchReddit } from "@/actions/orchestrate"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Header } from "@/components/header"

const STAGES = [
  { label: "Searching Reddit" },
  { label: "Extracting threads" },
  { label: "Analyzing reviews" },
]

export default function RedditScoutPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const [btnHover, setBtnHover] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [searchedQuery, setSearchedQuery] = useState("")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) {
      setLoadingStage(0)
      timerRef.current = setInterval(() => {
        setLoadingStage((prev) => {
          if (prev >= 2) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 2
          }
          return prev + 1
        })
      }, 6000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setError("Please enter a product or topic")
      return
    }
    setSearchedQuery(query)
    setIsLoading(true)
    setError("")
    setResult(null)
    setCopied(false)

    try {
      const response = await searchReddit(query)
      if (response.success) {
        setResult(response.data)
      } else {
        setError(response.error || "Search failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setQuery("")
    setError("")
    setCopied(false)
  }

  const handleCopy = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-neutral-900">
      <Header />

      <main className="px-8 py-16 max-w-4xl mx-auto">

        {/* Loading Screen */}
        {isLoading && !result && (
          <div className="animate-in fade-in duration-500 max-w-md mx-auto mt-20">
            <p className="text-center text-3xl font-serif italic text-neutral-900 mb-12">
              &ldquo;{searchedQuery}&rdquo;
            </p>
            <div className="space-y-6">
              {STAGES.map((stage, i) => {
                const isCompleted = i < loadingStage
                const isActive = i === loadingStage
                const isUpcoming = i > loadingStage
                return (
                  <div
                    key={stage.label}
                    className="flex items-center gap-4"
                    style={{ animation: isActive ? 'fade-stage 0.5s ease-out' : 'none' }}
                  >
                    {isCompleted && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <Check className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    {isActive && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div
                          className="w-2.5 h-2.5 rounded-full bg-neutral-900"
                          style={{ animation: 'pulse-dot 1.5s ease-in-out infinite' }}
                        />
                      </div>
                    )}
                    {isUpcoming && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full border border-neutral-300" />
                      </div>
                    )}
                    <span
                      className={`text-sm tracking-wide transition-colors duration-300 ${
                        isActive ? 'text-neutral-900 font-medium' : 'text-neutral-300'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Search Form */}
        {!isLoading && !result && (
          <div className={`transition-all duration-700 ease-out ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-4">Powered by Lamatic AI</p>
              <h1 className="text-6xl md:text-7xl font-serif italic text-neutral-900 mb-5 leading-tight">
                Reddit Scout
              </h1>
              <p className="text-base text-neutral-500 max-w-md mx-auto leading-relaxed">
                What are real people actually saying? Search any product and get honest Reddit reviews, instantly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-px bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center bg-white rounded-full border border-neutral-200 shadow-sm group-focus-within:shadow-md group-focus-within:border-neutral-300 transition-all duration-300">
                  <Search className="absolute left-5 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-500 transition-colors duration-300" />
                  <Input
                    id="query"
                    placeholder="e.g. Sony WH-1000XM5, HP Victus..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-14 pl-12 pr-32 bg-transparent border-0 rounded-full text-base placeholder:text-neutral-300 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    onMouseEnter={() => setBtnHover(true)}
                    onMouseLeave={() => setBtnHover(false)}
                    className="absolute right-2 h-10 px-6 rounded-full bg-neutral-100 text-neutral-500 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-neutral-200 hover:text-neutral-800 active:translate-y-0.5 active:shadow-sm active:bg-neutral-300 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : btnHover ? (
                      <MousePointerClick className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-4 text-center">{error}</p>
              )}
            </form>

            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {["HP Victus", "AirPods Pro", "Sony XM5", "iPhone 16"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="text-xs px-4 py-2 rounded-full border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:border-neutral-400 transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-10">
              <div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-700 transition-colors duration-200 mb-3"
                >
                  <ArrowLeft className="w-3 h-3" />
                  New search
                </button>
                <h2 className="text-3xl font-serif italic text-neutral-900">
                  &ldquo;{searchedQuery}&rdquo;
                </h2>
                <p className="text-sm text-neutral-400 mt-1">What Reddit thinks</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-700 transition-colors duration-200 border border-neutral-200 rounded-full px-4 py-2 hover:border-neutral-400"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-10 md:p-12">
              <div className="prose prose-neutral prose-lg max-w-none prose-headings:font-serif prose-headings:italic prose-headings:text-neutral-900 prose-headings:font-normal prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-neutral-100 prose-p:text-neutral-600 prose-p:leading-relaxed prose-li:text-neutral-600 prose-li:leading-relaxed prose-li:my-1.5 prose-strong:text-neutral-800 prose-blockquote:border-l-neutral-300 prose-blockquote:text-neutral-500 prose-blockquote:italic prose-blockquote:font-normal prose-blockquote:bg-neutral-50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-100 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <p className="text-xs text-neutral-300 tracking-wide">Built with Lamatic AI</p>
          <p className="text-xs text-neutral-300 tracking-wide">Reddit Scout</p>
        </div>
      </footer>
    </div>
  )
}
