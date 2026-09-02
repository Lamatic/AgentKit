"use client"

import { useState } from "react"
import { ChevronDown, AlertTriangle, CheckCircle, Shield, ShieldAlert, ShieldX, Database, Type, Image, Eye } from "lucide-react"
import type { TrustReport, TrustReportFlag } from "@/actions/orchestrate"

interface TrustReportCardProps {
  report: TrustReport
}

// ── Risk Gauge (SVG circle) ───────────────────────────
function RiskGauge({ score }: { score: number }) {
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const progress = ((100 - score) / 100) * circumference // inverse: lower score = more green arc

  const color =
    score <= 25 ? "#22c55e" :
    score <= 55 ? "#f59e0b" :
    score <= 80 ? "#f97316" :
    "#ef4444"

  const label =
    score <= 25 ? "Low Risk" :
    score <= 55 ? "Moderate Risk" :
    score <= 80 ? "High Risk" :
    "Critical Risk"

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        {/* Background track */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64" cy="64" r={radius}
            fill="none" stroke="#1e293b" strokeWidth="10"
          />
          {/* Score arc */}
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white" style={{ color }}>{score}</span>
          <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Signal icons ─────────────────────────────────────
const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  metadata: <Database className="w-4 h-4" />,
  font_spacing: <Type className="w-4 h-4" />,
  ela: <Image className="w-4 h-4" />,
  vlm: <Eye className="w-4 h-4" />,
}

const SIGNAL_LABELS: Record<string, string> = {
  metadata: "Metadata",
  font_spacing: "Font/Spacing",
  ela: "ELA",
  vlm: "Visual (VLM)",
}

const SIGNAL_COLORS: Record<string, string> = {
  metadata: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  font_spacing: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  ela: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  vlm: "text-amber-400 bg-amber-500/10 border-amber-500/20",
}

// ── Individual flag card ──────────────────────────────
function FlagCard({ flag, index }: { flag: TrustReportFlag; index: number }) {
  const [open, setOpen] = useState(index === 0)

  const pct = Math.round(flag.confidence * 100)
  const barColor =
    pct >= 75 ? "bg-red-500" :
    pct >= 50 ? "bg-orange-500" :
    pct >= 30 ? "bg-amber-500" :
    "bg-yellow-500"

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
      >
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium flex-shrink-0 ${SIGNAL_COLORS[flag.signal] ?? "text-slate-400 bg-slate-800 border-slate-700"}`}>
          {SIGNAL_ICONS[flag.signal]}
          {SIGNAL_LABELS[flag.signal] ?? flag.signal}
        </span>
        <span className="flex-1 text-sm text-slate-200 truncate">{flag.region}</span>
        <span className="text-xs text-slate-500 flex-shrink-0">{pct}% confidence</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800">
          {/* Confidence bar */}
          <div className="pt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Confidence</span>
              <span className="text-slate-300">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {/* Plain-language explanation */}
          <p className="text-sm text-slate-300 leading-relaxed">{flag.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ── Signal breakdown bar ──────────────────────────────
function SignalBreakdown({ breakdown }: { breakdown: TrustReport["signal_breakdown"] }) {
  const signals = [
    { key: "metadata", label: "Metadata", ...breakdown.metadata },
    { key: "font_spacing", label: "Font/Spacing", ...breakdown.font_spacing },
    { key: "ela", label: "ELA", ...breakdown.ela },
    { key: "vlm", label: "Visual", ...breakdown.vlm },
  ]
  const maxContrib = Math.max(...signals.map(s => s.score_contribution), 1)

  return (
    <div className="space-y-2">
      {signals.map(s => (
        <div key={s.key} className="flex items-center gap-3 text-xs">
          <span className={`w-20 flex-shrink-0 flex items-center gap-1.5 ${SIGNAL_COLORS[s.key]?.split(" ")[0] ?? "text-slate-400"}`}>
            {SIGNAL_ICONS[s.key]}
            {s.label}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500/70 transition-all duration-700"
              style={{ width: `${(s.score_contribution / maxContrib) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-slate-400">{s.score_contribution}</span>
          <span className="w-14 text-right text-slate-600">{s.flags} flag{s.flags !== 1 ? "s" : ""}</span>
        </div>
      ))}
    </div>
  )
}

// ── Verdict icon ──────────────────────────────────────
function VerdictIcon({ color }: { color: TrustReport["verdict_color"] }) {
  if (color === "green") return <CheckCircle className="w-5 h-5 text-green-400" />
  if (color === "amber") return <Shield className="w-5 h-5 text-amber-400" />
  if (color === "orange") return <ShieldAlert className="w-5 h-5 text-orange-400" />
  return <ShieldX className="w-5 h-5 text-red-400" />
}

const VERDICT_BG: Record<TrustReport["verdict_color"], string> = {
  green: "bg-green-500/10 border-green-500/20 text-green-300",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-300",
  orange: "bg-orange-500/10 border-orange-500/20 text-orange-300",
  red: "bg-red-500/10 border-red-500/20 text-red-300",
}

// ── Main trust report card ────────────────────────────
export function TrustReportCard({ report }: TrustReportCardProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">

      {/* Score + Verdict */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-center gap-6">
          <RiskGauge score={report.risk_score} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white mb-2">Analysis Complete</h2>
            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm leading-snug ${VERDICT_BG[report.verdict_color]}`}>
              <VerdictIcon color={report.verdict_color} />
              <span>{report.verdict}</span>
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-0.5">
              <p>📄 {report.document_info.file_name}</p>
              <p>🕒 {new Date(report.document_info.analyzed_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Detection Signal Breakdown
        </h3>
        <SignalBreakdown breakdown={report.signal_breakdown} />
      </div>

      {/* Flags */}
      {report.flags.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {report.flags.length} Flagged Region{report.flags.length !== 1 ? "s" : ""}
          </h3>
          {report.flags
            .sort((a, b) => b.confidence - a.confidence)
            .map((flag, i) => (
              <FlagCard key={i} flag={flag} index={i} />
            ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300 text-sm">No suspicious regions detected. Document appears consistent across all checked signals.</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <p className="text-xs text-slate-500 leading-relaxed">
          ⚠️ <strong className="text-slate-400">Disclaimer:</strong> {report.disclaimer}
        </p>
      </div>
    </div>
  )
}
