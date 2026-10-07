"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Printer } from "lucide-react";
import type { Plan } from "@/actions/orchestrate";
import type { HarvestCalc } from "@/lib/calc";

/** Plain-text version of the plan, for copying or sending to a plumber. */
export function planToText(location: string, calc: HarvestCalc, plan: Plan): string {
  const pit = calc.rechargePit;
  const lines = [
    `Rainwater harvesting plan — ${location}`,
    "",
    `Water collectable: ${calc.annualHarvestL.toLocaleString("en-IN")} L/year`,
    `Recommended tank: ${calc.recommendedTankL.toLocaleString("en-IN")} L (meets ${calc.reliabilityPct}% of demand)`,
    pit.needed
      ? `Recharge: ${pit.pits} pit(s), ${pit.diameterM} m wide × ${pit.depthM} m deep`
      : "Recharge pit: not needed",
    "",
    plan.summary,
    "",
    "Steps:",
    ...plan.installation_steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "Maintenance:",
    ...plan.maintenance.map((m) => `- ${m.task} (${m.frequency})`),
  ];
  if (plan.cost_estimate.high_inr > 0) {
    lines.push(
      "",
      `Indicative cost: ₹${plan.cost_estimate.low_inr.toLocaleString("en-IN")} – ₹${plan.cost_estimate.high_inr.toLocaleString("en-IN")}`,
    );
  }
  return lines.join("\n");
}

export function PlanActions({ location, calc, plan }: { location: string; calc: HarvestCalc; plan: Plan }) {
  const [copied, setCopied] = useState(false);
  const text = planToText(location, calc, plan);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const btn =
    "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-primary-soft";

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={copy} className={btn}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <a
        className={btn}
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </a>
      <button type="button" onClick={() => window.print()} className={btn}>
        <Printer className="h-3.5 w-3.5" /> Print / PDF
      </button>
    </div>
  );
}
