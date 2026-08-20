import type { ResultStats } from "../lib/contracts";

export interface StatsStripProps {
  stats: ResultStats;
  rowCount: number;
  className?: string;
}

function formatBound(v: number | string | undefined): string {
  if (v === undefined) return "—";
  return typeof v === "number" ? String(Math.round(v * 100) / 100) : v;
}

/**
 * Compact deterministic digest of a CompactResult's ResultStats — replaces
 * paging through a huge raw table with a one-line-per-column strip of
 * min/max/nulls (+distinct when present), plus the overall row count and
 * date span. This is exactly what the analyst model sees, so the UI mirrors
 * the model's actual context rather than a full table it never looked at.
 */
export function StatsStrip({ stats, rowCount, className }: StatsStripProps) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-mono font-medium text-foreground">{rowCount.toLocaleString()} rows</span>
        {stats.dateSpan && (
          <span className="font-mono">
            {stats.dateSpan.column}: {stats.dateSpan.min} → {stats.dateSpan.max}
          </span>
        )}
      </div>
      {stats.columns.length > 0 && (
        <div className="grid max-w-full gap-1 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3">
          {stats.columns.map((c) => (
            <div
              key={c.name}
              className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2 py-1 font-mono text-[11px]"
            >
              <span className="truncate font-medium text-foreground" title={c.name}>
                {c.name}
              </span>
              <span className="shrink-0 whitespace-nowrap text-muted-foreground">
                {formatBound(c.min)}–{formatBound(c.max)}
                {c.nulls !== undefined ? ` · ${c.nulls} null` : ""}
                {c.distinct !== undefined ? ` · ${c.distinct} distinct` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
