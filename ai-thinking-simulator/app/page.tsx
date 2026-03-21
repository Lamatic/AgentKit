"use client"

import { useState } from "react"
import { simulateThinking, type ThinkingResult, type Perspective } from "../actions/orchestrate"

const EXAMPLES = [
  "Should I quit my job to start a startup?",
  "Should I use MongoDB or PostgreSQL for a real-time chat app?",
  "Should I take a low-paying AI job or a higher-paying non-AI job?",
  "Should I move to a new city for a better opportunity?",
  "Should I build in public or stay stealth until launch?",
]

const PERSONA_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  default:          { bg: "#f9f9f9", border: "#e5e5e5", badge: "#f0f0f0", text: "#333" },
  "Logical Thinker":{ bg: "#f0f7ff",  border: "#d0e8ff",  badge: "#e0f2ff",  text: "#0066cc" },
  "Investor":       { bg: "#f0fdf4",  border: "#d0f5d0",  badge: "#e0f8e0", text: "#15803d" },
  "Risk-Averse Parent":{ bg: "#fffbf0", border: "#ffe8cc", badge: "#fff3e0", text: "#d97706" },
  "Startup Founder":{ bg: "#fef2f2", border: "#fecaca", badge: "#fee2e2", text: "#dc2626" },
  "Future You":     { bg: "#faf5ff", border: "#f0d9ff", badge: "#f3e8ff", text: "#7c3aed" },
}

function PerspectiveCard({ p, index }: { p: Perspective; index: number }) {
  const [open, setOpen] = useState(true)
  const colors = PERSONA_COLORS[p.role] ?? PERSONA_COLORS.default

  return (
    <div
      className="rounded-xl border transition-all duration-300 hover:shadow-sm"
      style={{
        background: colors.bg,
        borderColor: colors.border,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{p.emoji}</span>
          <div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full font-mono"
              style={{ background: colors.badge, color: colors.text }}
            >
              {p.role}
            </span>
          </div>
        </div>
        <svg
          className="w-5 h-5 transition-transform duration-200"
          style={{ color: colors.text, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t" style={{ borderTopColor: colors.border }}>
          {/* Opinion */}
          <p className="text-base font-medium leading-relaxed pt-4" style={{ color: colors.text }}>
            "{p.opinion}"
          </p>

          {/* Reasoning */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-1.5 text-gray-500">Reasoning</p>
            <p className="text-sm text-gray-700 leading-relaxed">{p.reasoning}</p>
          </div>

          {/* Concerns */}
          {p.concerns && (
            <div className="flex items-start gap-2 rounded-lg p-3 bg-yellow-50 border border-yellow-200">
              <span className="text-sm mt-0.5">⚠️</span>
              <p className="text-sm text-gray-700 leading-relaxed">{p.concerns}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444"
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm font-mono font-medium" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function Home() {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ThinkingResult | null>(null)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await simulateThinking(question.trim())
      if (res.success && res.data) {
        setResult(res.data)
      } else {
        setError(res.error ?? "Something went wrong")
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-red-100" style={{ color: "#dc2626" }}>
              🧠
            </div>
            <span className="text-base font-bold text-gray-900">Thinking Simulator</span>
          </div>
          <span className="text-xs font-medium text-gray-500">Powered by Lamatic</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {!result && !loading ? (
          <>
            {/* Hero Section */}
            <div className="text-center py-20">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold" style={{ border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                  AI Decision Engine
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                See how different minds<br />
                <span style={{ color: "#dc2626" }}>think about your decision</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
                Get perspectives from 5 distinct cognitive lenses — Logical Thinker, Investor, Risk-Averse Parent, Startup Founder, and Future You — then a synthesized recommendation.
              </p>

              {/* Input form */}
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Should I use MongoDB or PostgreSQL for my app?"
                    rows={2}
                    className="w-full rounded-xl border-2 px-6 py-4 text-base text-gray-900 placeholder-gray-400 resize-none outline-none transition-all duration-200 focus:border-red-500"
                    style={{
                      background: "#f9f9f9",
                      borderColor: question ? "#dc2626" : "#e5e5e5",
                    }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="absolute bottom-3 right-3 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "#dc2626" }}
                  >
                    {loading ? "Thinking..." : "→"}
                  </button>
                </div>
              </form>

              {/* Example pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setQuestion(ex)}
                    className="text-sm px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-150"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-8 flex items-center justify-center gap-2">
                <span>💳</span> No credit card required
              </p>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800 mt-6 font-medium">
                  {error}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Loading state */}
            {loading && (
              <div className="text-center py-24">
                <div className="thinking-dots flex justify-center gap-2 mb-6">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-3 h-3 rounded-full bg-red-500" style={{ animation: `pulse 1.4s infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <p className="text-gray-600 text-base font-medium">Consulting 5 different minds...</p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="py-12">
                {/* Question recap */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 mb-12">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Your question</p>
                  <p className="text-lg text-gray-900 font-medium">"{question}"</p>
                </div>

                {/* Perspectives */}
                <div className="mb-8">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">5 perspectives</p>
                  <div className="space-y-4">
                    {result.perspectives.map((p, i) => (
                      <PerspectiveCard key={p.role} p={p} index={i} />
                    ))}
                  </div>
                </div>

                {/* Final synthesis */}
                <div
                  className="rounded-xl border-2 p-8 mt-12"
                  style={{
                    background: "#fef2f2",
                    borderColor: "rgba(220, 38, 38, 0.3)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🎯</span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-red-700">Final Synthesis</span>
                  </div>

                  <p className="text-gray-900 leading-relaxed mb-6 text-base">{result.final_synthesis}</p>

                  {result.recommended_action && (
                    <div className="rounded-lg px-5 py-4 mb-6 bg-white border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">Recommended action</p>
                      <p className="text-gray-900 font-medium">{result.recommended_action}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Confidence</p>
                    <ConfidenceMeter value={result.confidence} />
                  </div>
                </div>

                {/* Reset */}
                <button
                  onClick={() => { setResult(null); setQuestion("") }}
                  className="w-full mt-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-150"
                >
                  Ask another question
                </button>
              </div>
            )}


          </>
        )}
      </main>

      <footer className="border-t border-gray-200 text-center py-8 mt-16 text-xs text-gray-500">
        <p>Built with Lamatic AI</p>
      </footer>
    </div>
  )
}
