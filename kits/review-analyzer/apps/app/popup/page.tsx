"use client"

import { useEffect, useState } from "react"
import { analyzeReviews } from "@/actions/orchestrate"
import { ShieldCheck, ShieldAlert, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react"

interface AnalysisResult {
  summary: string
  pros: string[]
  cons: string[]
  trustScore: number
  trustLabel: string
  analysisDetail: string
}

export default function PopupPage() {
  const [loading, setLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState(0)
  const [reviews, setReviews] = useState<string[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 1. Send signal that iframe is ready to receive data
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Notify parent Chrome extension that the iframe is ready
      window.parent.postMessage({ type: "IFRAME_READY" }, "*")
    }
  }, [])

  // 2. Listen for scraped reviews from the parent Chrome extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      if (message && message.type === "REVIEWS_SCRAPED") {
        console.log("[Next.js] Received reviews:", message.reviews)
        setReviews(message.reviews)
        triggerAnalysis(message.reviews)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // 3. Loading animation steps
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 5)
    }, 2000)
    return () => clearInterval(interval)
  }, [loading])

  const triggerAnalysis = async (reviewsData: string[]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await analyzeReviews(reviewsData)
      if (response.success && response.data) {
        // Parse the LLM JSON response
        const parsed = JSON.parse(response.data) as AnalysisResult
        setResult(parsed)
      } else {
        setError(response.error || "Failed to analyze reviews.")
      }
    } catch (err) {
      console.error(err)
      setError("An unexpected error occurred during analysis.")
    } finally {
      setLoading(false)
    }
  }

  // Get color mapping for Trust Score
  const getTrustColors = (score: number) => {
    if (score >= 80) return { text: "text-emerald-400", border: "stroke-emerald-500", bg: "bg-emerald-500/10", label: "text-emerald-400", icon: ShieldCheck }
    if (score >= 50) return { text: "text-amber-400", border: "stroke-amber-500", bg: "bg-amber-500/10", label: "text-amber-400", icon: AlertTriangle }
    return { text: "text-rose-400", border: "stroke-rose-500", bg: "bg-rose-500/10", label: "text-rose-400", icon: ShieldAlert }
  }

  const trustInfo = result ? getTrustColors(result.trustScore) : null
  const TrustIcon = trustInfo?.icon || ShieldCheck

  const loadingStepsText = [
    "Parsing scraped reviews...",
    "Analyzing consensus & sentiment...",
    "Auditing spelling & patterns...",
    "Detecting artificial behavior...",
    "Calculating trust score..."
  ]

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e4e6eb] p-4 flex flex-col font-sans select-none overflow-x-hidden">
      {loading && (
        <div className="flex-grow flex flex-col items-center justify-center py-12 px-6">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-[#9ca3af] h-6 animate-pulse transition-all duration-300">
            {loadingStepsText[loadingStep]}
          </p>
        </div>
      )}

      {error && (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-base font-semibold text-white mb-2">Analysis Failed</h2>
          <p className="text-sm text-[#9ca3af] mb-6 max-w-xs">{error}</p>
          <button
            onClick={() => triggerAnalysis(reviews)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {!loading && !error && result && (
        <div className="flex-grow flex flex-col gap-5">
          
          {/* Header Stat & Circle Gauge Row */}
          <div className="flex items-center justify-between bg-[#12141c]/60 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#9ca3af] font-medium uppercase tracking-wider">Analysis Dataset</span>
              <span className="text-base font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                {reviews.length} Reviews
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" className="stroke-white/5" strokeWidth="5" fill="transparent" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  className={`${trustInfo?.border} transition-all duration-1000 ease-out`} 
                  strokeWidth="5" 
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - result.trustScore / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-base font-extrabold text-white tracking-tight">{result.trustScore}</span>
                <span className="text-[7px] font-semibold uppercase tracking-wider text-[#9ca3af]">Trust</span>
              </div>
            </div>
          </div>

          {/* Trust Level Indicator */}
          <div className={`flex items-start gap-3 rounded-2xl p-4 border border-white/5 ${trustInfo?.bg}`}>
            <TrustIcon className={`w-5 h-5 mt-0.5 shrink-0 ${trustInfo?.text}`} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Agent Verdict</span>
              <span className={`text-sm font-bold ${trustInfo?.text}`}>{result.trustLabel}</span>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">{result.analysisDetail}</p>
            </div>
          </div>

          {/* Consensus Summary */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Consensus Summary
            </span>
            <div className="bg-[#12141c]/40 border border-white/5 rounded-2xl p-3.5">
              <p className="text-xs text-[#a1a1aa] leading-relaxed text-justify">{result.summary}</p>
            </div>
          </div>

          {/* Pros & Cons Section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pros */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Pros
              </span>
              <ul className="flex flex-col gap-2">
                {result.pros.map((pro, index) => (
                  <li key={index} className="text-[11px] leading-relaxed text-[#a1a1aa] bg-[#12141c]/30 border border-white/5 rounded-xl p-2 flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold shrink-0">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
                {result.pros.length === 0 && (
                  <li className="text-[11px] text-[#9ca3af] italic text-center py-4">None mentioned</li>
                )}
              </ul>
            </div>

            {/* Cons */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" /> Cons
              </span>
              <ul className="flex flex-col gap-2">
                {result.cons.map((con, index) => (
                  <li key={index} className="text-[11px] leading-relaxed text-[#a1a1aa] bg-[#12141c]/30 border border-white/5 rounded-xl p-2 flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold shrink-0">•</span>
                    <span>{con}</span>
                  </li>
                ))}
                {result.cons.length === 0 && (
                  <li className="text-[11px] text-[#9ca3af] italic text-center py-4">None mentioned</li>
                )}
              </ul>
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}
