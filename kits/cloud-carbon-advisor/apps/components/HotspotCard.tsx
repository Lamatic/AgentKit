"use client";

import {
  Server,
  HardDrive,
  Network,
  Box,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Globe,
  Wrench,
} from "lucide-react";
import type { ReportHotspot, UsageClass } from "../lib/types";
import { GridIntensityBar } from "./GridIntensityBar";
import { driverLabel, formatKg, providerLabel, usageClassLabel } from "../lib/format";

function usageIcon(u: UsageClass) {
  if (u === "compute" || u === "memory") return <Server className="w-4 h-4" />;
  if (u === "storage-ssd" || u === "storage-hdd") return <HardDrive className="w-4 h-4" />;
  if (u === "network") return <Network className="w-4 h-4" />;
  return <Box className="w-4 h-4" />;
}

function Pill({ tone, children }: { tone: "low" | "medium" | "high" | "accent" | "neutral"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    low: "border-sev-low/30 bg-sev-low-soft text-sev-low",
    medium: "border-sev-medium/30 bg-sev-medium-soft text-sev-medium",
    high: "border-sev-high/30 bg-sev-high-soft text-sev-high",
    accent: "border-accent/30 bg-accent-soft text-accent",
    neutral: "border-edge bg-bg/50 text-muted",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${map[tone]}`}>
      {children}
    </span>
  );
}

export function HotspotCard({ hotspot, rank }: { hotspot: ReportHotspot; rank: number }) {
  const { diagnosis, recommendation, cleanerRegion } = hotspot;
  const sharePct = Math.round(hotspot.shareOfTotal * 100);

  return (
    <article className="animate-fade-up rounded-[var(--radius)] border border-edge bg-panel/70 backdrop-blur p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-edge-strong bg-bg/60 text-xs font-semibold text-muted">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-2">{usageIcon(hotspot.usageClass)}</span>
            <h3 className="text-sm font-semibold text-ink truncate">
              {hotspot.service} · {hotspot.regionLabel}
            </h3>
            <Pill tone="neutral">{providerLabel(hotspot.provider)}</Pill>
            <Pill tone="neutral">{usageClassLabel(hotspot.usageClass)}</Pill>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-2">
            {hotspot.region} · account {hotspot.subAccount} ·{" "}
            {Math.round(hotspot.usageAmount).toLocaleString("en-US")} {hotspot.usageUnit}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-semibold text-ink tabular-nums">{formatKg(hotspot.emissionsKg)}</div>
          <div className="text-[11px] text-muted-2">{sharePct}% of total</div>
        </div>
      </div>

      {/* Share bar */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-bg/70 overflow-hidden">
        <div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.max(3, sharePct)}%` }} />
      </div>

      {/* Diagnosis */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Pill tone={hotspot.gridIntensity >= 400 ? "high" : "medium"}>{driverLabel(diagnosis.driverClass)}</Pill>
        <Pill tone="neutral">confidence: {diagnosis.confidence}</Pill>
        {hotspot.flags.map((f) => (
          <Pill key={f} tone="medium">
            <AlertTriangle className="w-3 h-3" /> {f}
          </Pill>
        ))}
      </div>
      {diagnosis.reasoning && <p className="mt-2 text-xs text-muted leading-relaxed">{diagnosis.reasoning}</p>}
      {diagnosis.evidence.length > 0 && (
        <ul className="mt-2 space-y-1">
          {diagnosis.evidence.map((e, i) => (
            <li key={i} className="text-[11px] text-muted-2 flex gap-1.5">
              <span className="text-accent">›</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Grid comparison */}
      {cleanerRegion && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-edge bg-bg/30 p-3">
          <GridIntensityBar
            currentLabel={hotspot.regionLabel}
            currentIntensity={hotspot.gridIntensity}
            cleanerLabel={cleanerRegion.regionLabel}
            cleanerIntensity={cleanerRegion.gridIntensity}
          />
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            <ArrowRight className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted">
              Same workload in <span className="text-ink font-medium">{cleanerRegion.regionLabel}</span> emits{" "}
              <span className="text-accent font-semibold">{cleanerRegion.reductionPct}% less</span>
            </span>
            {cleanerRegion.crossContinent && (
              <Pill tone="medium">
                <Globe className="w-3 h-3" /> cross-region
              </Pill>
            )}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="mt-4 rounded-[var(--radius-sm)] border border-accent/20 bg-accent-soft/60 p-3.5">
        <div className="flex items-start gap-2">
          <Wrench className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink font-medium">{recommendation.action}</p>
            {recommendation.rationale && (
              <p className="mt-1 text-xs text-muted leading-relaxed">{recommendation.rationale}</p>
            )}
            {recommendation.prerequisites.length > 0 && (
              <p className="mt-1.5 text-[11px] text-muted-2">
                Prerequisites: {recommendation.prerequisites.join("; ")}
              </p>
            )}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <Pill tone="accent">
                <TrendingDown className="w-3 h-3" /> −{formatKg(hotspot.projectedReductionKg)}
              </Pill>
              <Pill tone={recommendation.effort === "high" ? "high" : recommendation.effort === "medium" ? "medium" : "low"}>
                effort: {recommendation.effort}
              </Pill>
              <Pill tone={recommendation.risk === "high" ? "high" : recommendation.risk === "medium" ? "medium" : "low"}>
                risk: {recommendation.risk}
              </Pill>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
