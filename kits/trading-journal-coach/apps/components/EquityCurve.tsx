"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Metrics } from "@/lib/types";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const kFmt = (v: number | string) => `${Math.round(Number(v) / 1000)}k`;
const tipStyle = { background: "#141922", border: "1px solid #262e3a", borderRadius: 8, color: "#e6e9ef" };

export default function EquityCurve({ metrics }: { metrics: Metrics }) {
  const eq = metrics.equityCurve || [];
  let peak = -Infinity;
  const data = eq.map((pt) => {
    peak = Math.max(peak, pt.cum);
    return { i: pt.i + 1, cum: pt.cum, dd: Math.round(pt.cum - peak) };
  });

  return (
    <div className="panel">
      <h3>Equity curve &amp; drawdown</h3>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#262e3a" strokeDasharray="3 3" />
            <XAxis dataKey="i" tick={{ fill: "#8b93a3", fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: "#8b93a3", fontSize: 11 }} tickLine={false} width={48} tickFormatter={kFmt} />
            <Tooltip contentStyle={tipStyle} formatter={(v) => inr(Number(v))} labelFormatter={(l) => `Trade ${l}`} />
            <ReferenceLine y={0} stroke="#3a4453" />
            <Area type="monotone" dataKey="cum" name="Cumulative P&L" stroke="#4f8cff" fill="#4f8cff22" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ width: "100%", height: 96, marginTop: 4 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <XAxis dataKey="i" hide />
            <YAxis tick={{ fill: "#8b93a3", fontSize: 11 }} width={48} tickFormatter={kFmt} />
            <Tooltip contentStyle={tipStyle} formatter={(v) => inr(Number(v))} labelFormatter={(l) => `Trade ${l}`} />
            <Area type="monotone" dataKey="dd" name="Drawdown" stroke="#ff5c6c" fill="#ff5c6c22" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
