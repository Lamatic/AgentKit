"use client";

import { Leaf, Zap, Activity, TrendingDown, Plane, TreePine, Car, Smartphone } from "lucide-react";
import type { Report } from "../lib/types";
import { formatMass, formatKg, formatNumber, providerLabel } from "../lib/format";

export function FootprintSummary({ report }: { report: Report }) {
  const tonnes = report.totalEmissionsKg / 1000;
  const headline =
    tonnes >= 1 ? tonnes.toFixed(2) : report.totalEmissionsKg.toFixed(1);
  const headlineUnit = tonnes >= 1 ? "tCO₂e" : "kgCO₂e";

  return (
    <section className="animate-fade-up rounded-[var(--radius)] border border-edge bg-panel/70 backdrop-blur overflow-hidden">
      <div className="grid md:grid-cols-[1.1fr_1.4fr]">
        {/* Headline */}
        <div className="p-6 sm:p-7 border-b md:border-b-0 md:border-r border-edge bg-gradient-to-br from-accent-soft to-transparent">
          <div className="flex items-center gap-2 text-xs text-accent mb-3">
            <Leaf className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest">Total footprint · {report.periodLabel}</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl sm:text-6xl font-bold tracking-tight text-ink tabular-nums">{headline}</span>
            <span className="mb-1.5 text-lg text-muted">{headlineUnit}</span>
          </div>
          <p className="mt-3 text-sm text-muted max-w-md">{report.execSummary}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {report.providerMix.map((p) => (
              <span
                key={p.provider}
                className="rounded-full border border-edge bg-bg/50 px-2.5 py-1 text-[11px] text-muted"
              >
                {providerLabel(p.provider)} · {formatKg(p.emissionsKg)}
              </span>
            ))}
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-px bg-edge">
          <Stat icon={<Zap className="w-4 h-4" />} label="Electricity" value={`${formatNumber(Math.round(report.totalEnergyKwh))} kWh`} sub="estimated consumption" />
          <Stat icon={<Activity className="w-4 h-4" />} label="Avg grid intensity" value={`${report.averageGridIntensity} g/kWh`} sub="emissions-weighted" />
          <Stat
            icon={<TrendingDown className="w-4 h-4 text-accent" />}
            label="Projected reduction"
            value={`${formatKg(report.totalProjectedReductionKg)}`}
            sub={`${report.projectedReductionPct.toFixed(1)}% of total`}
            highlight
          />
          <Stat
            icon={<Leaf className="w-4 h-4 text-accent" />}
            label="Region-move ceiling"
            value={`${formatKg(report.cleanestRegionOpportunityKg)}`}
            sub="if hotspots ran on the cleanest grid"
          />
        </div>
      </div>

      {/* Equivalences */}
      <div className="border-t border-edge px-6 py-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-2 mb-3">
          {formatMass(report.totalEmissionsKg)} is roughly equivalent to
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Equiv icon={<Plane className="w-4 h-4" />} value={formatNumber(report.equivalences.flightsLondonNewYork)} unit="London→NYC flights" />
          <Equiv icon={<TreePine className="w-4 h-4" />} value={formatNumber(report.equivalences.treeSeedlings10yr)} unit="tree seedlings (10 yr)" />
          <Equiv icon={<Car className="w-4 h-4" />} value={formatNumber(report.equivalences.gasolineCarMiles)} unit="miles driven" />
          <Equiv icon={<Smartphone className="w-4 h-4" />} value={formatNumber(report.equivalences.smartphoneCharges)} unit="phone charges" />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-5 bg-panel ${highlight ? "" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${highlight ? "text-accent" : "text-ink"}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-2">{sub}</div>
    </div>
  );
}

function Equiv({ icon, value, unit }: { icon: React.ReactNode; value: string; unit: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-edge bg-bg/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-2">{icon}</div>
      <div className="mt-1 text-lg font-semibold text-ink tabular-nums">{value}</div>
      <div className="text-[11px] text-muted">{unit}</div>
    </div>
  );
}
