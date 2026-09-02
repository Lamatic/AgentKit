"use client"

import { useState } from "react"
import { Shield, Loader2, RotateCcw, Database, Type, ImageIcon, Eye, CheckCircle2, AlertCircle } from "lucide-react"
import { analyzeDocument, type TrustReport } from "@/actions/orchestrate"
import { Header } from "@/components/header"
import { UploadZone } from "@/components/upload-zone"
import { TrustReportCard } from "@/components/trust-report"

// ── Analysis stages shown during loading ─────────────
const STAGES = [
  { id: "metadata", icon: Database, label: "Inspecting metadata", sub: "Creation dates, software, modification history" },
  { id: "ocr", icon: Type, label: "Analysing font consistency", sub: "Statistical outlier detection on text blocks" },
  { id: "ela", icon: ImageIcon, label: "Running ELA analysis", sub: "Compression structure & pixel anomalies" },
  { id: "vlm", icon: Eye, label: "Visual AI assessment", sub: "Vision LLM reviewing flagged regions" },
]

function AnalysisProgress({ currentStage }: { currentStage: number }) {
  return (
    <div className="max-w-md mx-auto w-full space-y-3">
      <div className="text-center mb-6">
        <div className="relative inline-block mb-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>
        </div>
        <p className="text-white font-semibold">Analysing document…</p>
        <p className="text-slate-500 text-sm mt-1">This typically takes 10–30 seconds</p>
      </div>

      <div className="space-y-2">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon
          const isDone = i < currentStage
          const isActive = i === currentStage
          const isPending = i > currentStage

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                isDone ? "border-green-500/20 bg-green-500/5 opacity-70" :
                isActive ? "border-amber-500/30 bg-amber-500/10 shadow-lg shadow-amber-500/5" :
                "border-slate-800 bg-slate-900/30 opacity-40"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isDone ? "bg-green-500/15" :
                isActive ? "bg-amber-500/20" :
                "bg-slate-800"
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${
                  isDone ? "text-green-400" :
                  isActive ? "text-amber-300" :
                  "text-slate-600"
                }`}>{stage.label}</p>
                {isActive && (
                  <p className="text-xs text-slate-500 truncate">{stage.sub}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Hero section stats ────────────────────────────────
function HeroStats() {
  return (
    <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
      {[
        { label: "Detection Signals", value: "4" },
        { label: "File Formats", value: "PDF, JPG, PNG" },
        { label: "Avg. Analysis Time", value: "~20s" },
      ].map(s => (
        <div key={s.label} className="text-center">
          <p className="text-amber-400 font-bold text-lg leading-none">{s.value}</p>
          <p className="text-slate-600 text-xs mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────
export default function HomePage() {
  const [fileData, setFileData] = useState<{ base64: string; name: string; type: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [report, setReport] = useState<TrustReport | null>(null)
  const [error, setError] = useState("")

  const handleFileReady = (fileBase64: string, fileName: string, fileType: string) => {
    setFileData({ base64: fileBase64, name: fileName, type: fileType })
    setReport(null)
    setError("")
  }

  const handleAnalyze = async () => {
    if (!fileData) return

    setIsAnalyzing(true)
    setError("")
    setReport(null)
    setCurrentStage(0)

    // Animate through stages (the real work happens in parallel on the server)
    const stageTimer = setInterval(() => {
      setCurrentStage(prev => Math.min(prev + 1, STAGES.length - 1))
    }, 4500)

    try {
      const result = await analyzeDocument(fileData.base64, fileData.name, fileData.type)

      if (result.success && result.data) {
        setReport(result.data)
      } else {
        setError(result.error ?? "Analysis failed. Please try again.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error during analysis.")
    } finally {
      clearInterval(stageTimer)
      setIsAnalyzing(false)
      setCurrentStage(0)
    }
  }

  const handleReset = () => {
    setFileData(null)
    setReport(null)
    setError("")
    setIsAnalyzing(false)
  }

  return (
    <div className="min-h-screen bg-background grid-bg text-foreground flex flex-col">
      <Header />

      {/* Radial ambient light */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full relative z-10">

        {/* ── Not analyzed yet — Upload UI ── */}
        {!report && !isAnalyzing && (
          <div className="fade-up">
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Lamatic AgentKit Challenge
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
                Document<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  Tamper Detector
                </span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
                Upload any document and get an AI-powered trust report with a risk score,
                flagged regions, and plain-language explanations.
              </p>
              <HeroStats />
            </div>

            {/* Upload card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6 shadow-2xl shadow-black/30">
              <UploadZone onFileReady={handleFileReady} disabled={isAnalyzing} />

              {error && (
                <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                id="analyze-button"
                onClick={handleAnalyze}
                disabled={!fileData || isAnalyzing}
                className={`
                  mt-5 w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300
                  ${fileData && !isAnalyzing
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01]"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }
                `}
              >
                <Shield className="w-4 h-4" />
                Analyse Document
              </button>

              {/* Signal legend */}
              <div className="mt-5 pt-4 border-t border-slate-800/60">
                <p className="text-xs text-slate-600 mb-2.5 text-center">Detection signals run in sequence</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {STAGES.map(s => {
                    const Icon = s.icon
                    return (
                      <span key={s.id} className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                        <Icon className="w-3 h-3" />
                        {s.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Analyzing — progress ── */}
        {isAnalyzing && (
          <div className="fade-up">
            <AnalysisProgress currentStage={currentStage} />
          </div>
        )}

        {/* ── Report ready ── */}
        {report && !isAnalyzing && (
          <div className="fade-up space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Trust Report</h2>
              <button
                id="analyze-another-button"
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-500/10"
              >
                <RotateCcw className="w-4 h-4" />
                Analyse another
              </button>
            </div>

            <TrustReportCard report={report} />
          </div>
        )}

      </main>

      <footer className="py-4 text-center text-xs text-slate-700 border-t border-slate-900">
        Built with ❤️ for the{" "}
        <a href="https://git.new/agentKit" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-500 transition-colors underline underline-offset-2">
          Lamatic AgentKit Challenge
        </a>
      </footer>
    </div>
  )
}
