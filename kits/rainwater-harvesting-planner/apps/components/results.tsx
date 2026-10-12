"use client";

import { AlertTriangle, Droplets, Gauge, ShieldCheck, Waves, Wrench } from "lucide-react";
import { PlanActions } from "@/components/plan-actions";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlannerResult } from "@/actions/orchestrate";
import { MONTHS } from "@/lib/calc";

const fmt = (n: number) => n.toLocaleString("en-IN");
const kl = (litres: number) => `${(litres / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} kL`;

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Results({ result }: { result: Extract<PlannerResult, { ok: true }> }) {
  const { place, rainfall, calc, plan, planCheck, planError } = result;
  const pit = calc.rechargePit;
  const dailyDemand = calc.dailyDemandL;
  const chartData = MONTHS.map((m, i) => ({
    month: m,
    "Harvest (L)": calc.monthlyHarvestL[i],
    ...(dailyDemand > 0 ? { "Demand (L)": Math.round(dailyDemand * 30.4) } : {}),
  }));
  const location = [place.name, place.admin1, place.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{location}</h2>
        <p className="text-sm text-muted">
          Average of {rainfall.years.length} years ({rainfall.years[0]}–{rainfall.years[rainfall.years.length - 1]}) of daily
          rainfall · {rainfall.annualRainfallMm} mm/year · {rainfall.rainyDaysPerYear} rainy days/year · wettest month{" "}
          {rainfall.wettestMonth}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Droplets className="h-4 w-4" />} label="Water you can collect" value={kl(calc.annualHarvestL)} sub="per year, after first-flush losses" />
        <Stat icon={<Gauge className="h-4 w-4" />} label="Recommended tank" value={`${fmt(calc.recommendedTankL)} L`} sub={dailyDemand > 0 ? `meets ${calc.reliabilityPct}% of your demand` : "buffer before recharge"} />
        <Stat
          icon={<Waves className="h-4 w-4" />}
          label="Overflow to recharge"
          value={kl(calc.annualOverflowL)}
          sub={pit.needed ? `${pit.pits} pit${pit.pits > 1 ? "s" : ""} · ${pit.diameterM} m wide × ${pit.depthM} m deep` : "no recharge pit needed"}
        />
        <Stat
          icon={<Wrench className="h-4 w-4" />}
          label="Your demand"
          value={dailyDemand > 0 ? `${fmt(calc.dailyDemandL)} L/day` : "Recharge only"}
          sub={dailyDemand > 0 ? `rain can cover ${calc.annualCoveragePct}% of the year's need` : undefined}
        />
      </div>

      <div className="card">
        <h3 className="mb-3 font-medium">Monthly harvest vs demand</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => `${fmt(Number(v ?? 0))} L`} />
              <Legend />
              <Bar dataKey="Harvest (L)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              {dailyDemand > 0 && <Bar dataKey="Demand (L)" fill="var(--accent)" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {rainfall.driestMonths.length > 0 && (
          <p className="mt-2 text-xs text-muted">Near-dry months (under 10 mm): {rainfall.driestMonths.join(", ")}.</p>
        )}
      </div>

      <details className="card">
        <summary className="cursor-pointer font-medium">How the tank size was chosen</summary>
        <p className="mt-2 text-sm text-muted">
          Each tank size is simulated month by month over an average year. Starting from the smallest, the planner
          keeps upsizing only while every extra 1,000 L still adds at least 2 percentage points of demand met — after
          that, a bigger tank costs more but barely helps, and the extra rain is better sent to a recharge pit. Roof
          runoff coefficient used: {calc.runoffCoefficient}; the first 1 mm of each rainy day is diverted as first flush.
          {pit.needed &&
            ` The recharge pit is sized to swallow a typical year's wettest day (${fmt(pit.designStormL)} L): stone fill holds water only in its gaps (about 40%), so ${pit.excavationM3} m³ has to be dug.`}
        </p>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1">Tank</th>
              <th>Demand met</th>
              <th>Overflow / year</th>
            </tr>
          </thead>
          <tbody>
            {calc.tankOptions.map((t) => (
              <tr key={t.sizeL} className={t.sizeL === calc.recommendedTankL ? "font-semibold text-primary" : ""}>
                <td className="py-1">{fmt(t.sizeL)} L</td>
                <td>{dailyDemand > 0 ? `${t.reliabilityPct}%` : "—"}</td>
                <td>{kl(t.overflowL)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      {planError && (
        <div className="card flex gap-3 border-warn bg-warn-soft text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warn" />
          <div>
            <p className="font-medium">The numbers above are ready, but the written plan could not be generated.</p>
            <p className="text-muted">{planError}</p>
          </div>
        </div>
      )}

      {plan && (
        <div id="plan" className="card space-y-5">
          {planCheck && (
            <div
              className={`flex gap-2 rounded-lg p-3 text-sm ${planCheck.passed ? "bg-primary-soft" : "bg-warn-soft"}`}
              role="status"
            >
              {planCheck.passed ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-warn" />
              )}
              <div>
                <p className="font-medium">
                  {planCheck.passed
                    ? "Checked: the written plan matches the computed numbers."
                    : "Heads up: parts of the written plan disagree with the computed numbers. Trust the numbers above."}
                </p>
                {!planCheck.passed && (
                  <ul className="mt-1 list-disc pl-5 text-muted">
                    {planCheck.issues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-lg font-semibold">Your plan</h3>
            <PlanActions location={location} calc={calc} plan={plan} />
          </div>
          <div className="-mt-3">
            <p className="mt-1 text-sm">{plan.summary}</p>
            {plan.system_type && <p className="mt-2 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">{plan.system_type}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium">Storage tank</h4>
              <p className="mt-1 text-sm text-muted">{plan.tank_advice}</p>
            </div>
            <div>
              <h4 className="font-medium">Groundwater recharge</h4>
              <p className="mt-1 text-sm text-muted">{plan.recharge_advice}</p>
            </div>
          </div>

          {plan.components.length > 0 && (
            <div>
              <h4 className="font-medium">What you need</h4>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {plan.components.map((c) => (
                  <li key={c.name} className="rounded-lg border border-border p-3 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-muted">{c.purpose}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.installation_steps.length > 0 && (
            <div>
              <h4 className="font-medium">Installation steps</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                {plan.installation_steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {plan.maintenance.length > 0 && (
            <div>
              <h4 className="font-medium">Maintenance</h4>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {plan.maintenance.map((m, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1.5 pr-3">{m.task}</td>
                      <td className="py-1.5 text-right text-muted">{m.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {plan.cost_estimate.high_inr > 0 && (
            <div>
              <h4 className="font-medium">Indicative cost</h4>
              <p className="mt-1 text-sm">
                ₹{fmt(plan.cost_estimate.low_inr)} – ₹{fmt(plan.cost_estimate.high_inr)}
              </p>
              <p className="text-xs text-muted">{plan.cost_estimate.notes}</p>
            </div>
          )}

          {plan.water_quality && (
            <div>
              <h4 className="font-medium">Water quality</h4>
              <p className="mt-1 text-sm text-muted">{plan.water_quality}</p>
            </div>
          )}

          {plan.warnings.length > 0 && (
            <div className="rounded-lg bg-warn-soft p-3 text-sm">
              <p className="mb-1 flex items-center gap-2 font-medium text-warn">
                <AlertTriangle className="h-4 w-4" /> Check before you build
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {plan.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
