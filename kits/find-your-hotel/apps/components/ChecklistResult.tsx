"use client";

import { useState } from "react";
import type { PackingItem, PackingListResponse } from "@/lib/lamatic-client";
import type { WeatherSummary } from "@/lib/weather";

type Props = {
  data: PackingListResponse & { weather: WeatherSummary & { resolvedName: string } };
};

function Tag({
  title,
  subtitle,
  items,
  index,
}: {
  title: string;
  subtitle?: string;
  items: PackingItem[];
  index: number;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const done = items.filter((i) => checked[i.id]).length;

  return (
    <div
      className="stamp-in perforated bg-white/70 border border-ink/10 rounded-xl p-6 shadow-sm"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="font-display font-bold text-xl text-ink">{title}</h3>
        <span className="font-mono text-xs text-pine/70 whitespace-nowrap">
          {done}/{items.length}
        </span>
      </div>
      {subtitle && <p className="font-mono text-xs uppercase tracking-wide text-ink/50 mb-4">{subtitle}</p>}

      <ul className="space-y-2.5 mt-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              className="punch-checkbox"
              checked={!!checked[item.id]}
              onChange={() => toggle(item.id)}
              aria-label={item.label}
            />
            <span
              className={`font-body text-sm ${checked[item.id] ? "line-through text-ink/40" : "text-ink"}`}
            >
              {item.label}
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-ink/30">
              {item.category}
            </span>
          </li>
        ))}
      </ul>

      <div className="barcode w-full text-ink/40 mt-5" />
    </div>
  );
}

export default function ChecklistResult({ data }: Props) {
  const { weather, sharedItems, travelers, notes } = data;

  return (
    <div className="space-y-6">
      <div className="perforated bg-pine text-parchment rounded-xl p-6 shadow-sm">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-marigold">Forecast</span>
        <p className="font-display text-2xl font-semibold mt-2">{weather.resolvedName}</p>
        <p className="font-body text-sm mt-1 text-parchment/80">
          {weather.conditions}
          {weather.source === "climate-average" && " — based on historical averages, not a live forecast"}
        </p>
        {notes.length > 0 && (
          <ul className="mt-4 space-y-1">
            {notes.map((n, i) => (
              <li key={i} className="font-body text-sm text-marigold/90">
                ✦ {n}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Tag title="Group gear" subtitle="Shared across the trip" items={sharedItems} index={0} />
        {travelers.map((t, i) => (
          <Tag key={t.name} title={t.name} items={t.items} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
