import type { Rate } from "../lib/evidence/core.ts";

/**
 * Renders a Rate as "5/6 (83%)" from its integer numerator/denominator — never a raw
 * float, per the engine's own convention (core.ts §7.3).
 */
export function RateText({ rate, label }: { rate: Rate; label?: string }) {
  const pct = rate.denominator === 0 ? null : Math.round(rate.rate * 100);
  return (
    <span>
      {label ? <span className="sr-only">{label}: </span> : null}
      {rate.numerator}/{rate.denominator}
      {pct === null ? " (no evidence to measure)" : ` (${pct}%)`}
    </span>
  );
}
