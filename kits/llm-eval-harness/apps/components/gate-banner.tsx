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
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-xl border p-6",
        gatePassed ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10",
      )}
    >
      {gatePassed ? (
        <CheckCircle2 className="h-10 w-10 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-10 w-10 shrink-0 text-red-500" />
      )}
      <div className="flex-1">
        <div className={cn("text-2xl font-bold tracking-tight", gatePassed ? "text-emerald-500" : "text-red-500")}>
          {gatePassed ? "GATE PASSED" : "GATE FAILED"}
        </div>
        <p className="text-sm text-muted-foreground">
          {passed}/{total} cases passed · {passRate}% pass rate {gatePassed ? "≥" : "<"} {threshold}% threshold
        </p>
      </div>
      <div className="text-right">
        <div className="font-mono text-2xl font-semibold">{avgOverall}</div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">avg score</div>
      </div>
    </div>
  )
}
