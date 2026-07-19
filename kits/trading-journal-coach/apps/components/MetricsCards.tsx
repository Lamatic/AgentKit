"use client";

import type { Analysis } from "@/lib/types";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function MetricsCards({ analysis }: { analysis: Analysis }) {
  const p = analysis.metrics.performance;
  const r = analysis.metrics.risk;
  const score = analysis.coaching?.disciplineScore;

  const cards: { label: string; value: string; cls?: string }[] = [
    { label: "Net P&L", value: inr(p.netPnl), cls: p.netPnl >= 0 ? "pos" : "neg" },
    { label: "Win rate", value: `${(p.winRate * 100).toFixed(0)}%` },
    { label: "Profit factor", value: p.profitFactor != null ? p.profitFactor.toFixed(2) : "—" },
    { label: "Payoff (win/loss)", value: p.payoffRatio != null ? p.payoffRatio.toFixed(2) : "—" },
    { label: "Expectancy / trade", value: inr(p.expectancyPerTrade), cls: p.expectancyPerTrade >= 0 ? "pos" : "neg" },
    { label: "Max drawdown", value: inr(r.maxDrawdown), cls: "neg" },
    { label: "Trades", value: String(analysis.metrics.tradeCount) },
    { label: "Discipline score", value: analysis.mock ? "—" : `${score}/100` },
  ];

  return (
    <div className="cards">
      {cards.map((c) => (
        <div className="card" key={c.label}>
          <div className="label">{c.label}</div>
          <div className={`value ${c.cls || ""}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
