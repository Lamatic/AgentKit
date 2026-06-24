import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface GateBannerProps {
  gatePassed: boolean
  passRate: number
  threshold: number
  passed: number
  total: number
  avgOverall: number
}

export function GateBanner({ gatePassed, passRate, threshold, passed, total, avgOverall }: GateBannerProps) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(100, Math.max(0, passRate)) / 100) * circumference
  const accent = gatePassed ? "text-emerald-400" : "text-rose-400"

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
        {/* Pass-rate ring */}
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
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">pass</span>
          </div>
        </div>

        {/* Verdict */}
        <div className="flex-1">
          <div className={cn("flex items-center gap-2 text-2xl font-bold tracking-tight", accent)}>
            {gatePassed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            {gatePassed ? "GATE PASSED" : "GATE FAILED"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {passed} of {total} cases passed · {passRate}% {gatePassed ? "≥" : "<"} {threshold}% threshold
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <Stat label="passed" value={`${passed}/${total}`} />
          <Stat label="avg score" value={avgOverall.toFixed(1)} />
          <Stat label="gate" value={`${threshold}%`} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
      <div className="font-mono text-lg font-semibold leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}
