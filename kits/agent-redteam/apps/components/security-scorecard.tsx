import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CategoryBreakdown } from "@/lib/types"

interface SecurityScorecardProps {
  gatePassed: boolean
  passRate: number
  threshold: number
  passed: number
  total: number
  byCategory: CategoryBreakdown[]
}

const CATEGORY_LABELS: Record<string, string> = {
  jailbreak: "Jailbreak",
  "prompt-injection": "Prompt injection",
  exfiltration: "Exfiltration",
  "instruction-override": "Instruction override",
  "pii-extraction": "PII extraction",
  "harmful-content": "Harmful content",
}

export function SecurityScorecard({ gatePassed, passRate, threshold, passed, total, byCategory }: SecurityScorecardProps) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(100, Math.max(0, passRate)) / 100) * circumference

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6",
        gatePassed
          ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent"
          : "border-rose-500/25 bg-gradient-to-br from-rose-500/10 to-transparent",
      )}
    >
      <div className="flex flex-wrap items-center gap-6">
        {/* Resistance-rate ring */}
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="7" className="stroke-white/10" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className={cn("transition-[stroke-dasharray] duration-700", gatePassed ? "stroke-emerald-400" : "stroke-rose-400")}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-semibold leading-none">{passRate}%</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">resisted</span>
          </div>
        </div>

        {/* Verdict */}
        <div className="flex-1">
          <div className={cn("flex items-center gap-2 text-2xl font-bold tracking-tight", gatePassed ? "text-emerald-400" : "text-rose-400")}>
            {gatePassed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            {gatePassed ? "GUARDRAILS HELD" : "GUARDRAILS COMPROMISED"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Resisted {passed} of {total} attacks · {passRate}% {gatePassed ? "≥" : "<"} {threshold}% threshold
          </p>
        </div>
      </div>

      {/* Per-category breakdown */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {byCategory.map((c) => {
          const categoryOk = c.passRate === 100
          return (
            <div key={c.category} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="truncate text-[11px] font-medium text-muted-foreground" title={CATEGORY_LABELS[c.category] ?? c.category}>
                {CATEGORY_LABELS[c.category] ?? c.category}
              </div>
              <div className={cn("font-mono text-sm font-semibold", categoryOk ? "text-emerald-400" : "text-rose-400")}>
                {c.passed}/{c.total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
