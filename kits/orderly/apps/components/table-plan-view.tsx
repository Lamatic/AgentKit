"use client";

import { AlertTriangle, Ban, Check, Info } from "lucide-react";
import { formatPrice } from "@/lib/price";
import type { Diner } from "@/lib/types";
import type { TablePlan } from "@/lib/table-solver";

interface TablePlanViewProps {
  plan: TablePlan;
  diners: Diner[];
}

/** Rejections worth showing. "not-selected" is noise — the dish was simply fine. */
const NOTABLE_REJECTIONS = new Set([
  "allergen-conflict",
  "diet-conflict",
  "over-budget",
]);

/**
 * The order — the answer this app exists to give.
 *
 * Rendered above the menu, not below it, because "here is what to order" is the
 * product and "here is the menu, translated" is the raw material. Every
 * competitor in this space ships the second thing.
 */
export function TablePlanView({ plan, diners }: TablePlanViewProps) {
  const nameOf = (id: string) =>
    diners.find((diner) => diner.id === id)?.label ?? id;

  const notableRejections = plan.rejected.filter((rejection) =>
    NOTABLE_REJECTIONS.has(rejection.reason)
  );

  return (
    <section className="rounded-lg border-2 border-[var(--color-ring)] bg-[var(--color-card)] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Your order</h2>
        {plan.feasible && (
          <span className="text-sm tabular-nums text-[var(--color-muted-foreground)]">
            {formatPrice({ amount: plan.totalAmount, currency: plan.currency })}
            {plan.remaining !== null && (
              <>
                {" · "}
                <span className="text-[var(--color-safe)]">
                  {formatPrice({ amount: plan.remaining, currency: plan.currency })} left
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {/* ── No viable order ── */}
      {!plan.feasible && (
        <div className="rounded-md border border-[var(--color-caution-border)] bg-[var(--color-caution-bg)] p-3">
          <p className="flex items-start gap-2 text-sm text-[var(--color-caution)]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {/* Deliberately not a fallback suggestion: an order that breaks the
                budget or the constraints is not a lesser answer, it is a wrong
                one. Saying so is the honest move. */}
            {plan.infeasibleReason}
          </p>
        </div>
      )}

      {/* ── The order ── */}
      {plan.feasible && plan.order.length > 0 && (
        <ul className="space-y-2">
          {plan.order.map((line) => (
            <li
              key={line.dish.id}
              className="flex items-start justify-between gap-3 rounded-md border border-[var(--color-safe-border)] bg-[var(--color-safe-bg)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="script-original text-sm font-medium">
                  <Check
                    className="mr-1.5 inline h-3.5 w-3.5 text-[var(--color-safe)]"
                    aria-hidden="true"
                  />
                  {line.dish.nameTranslated || line.dish.nameOriginal}
                  {line.quantity > 1 && (
                    <span className="ml-1.5 text-[var(--color-muted-foreground)]">
                      ×{line.quantity}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                  {line.forDinerIds.length === diners.length
                    ? "everyone"
                    : line.forDinerIds.map(nameOf).join(", ")}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums">
                {formatPrice({ amount: line.amount, currency: plan.currency })}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* ── Who this order does not feed ── */}
      {plan.unfed.length > 0 && (
        <div className="mt-3 rounded-md border border-[var(--color-avoid-border)] bg-[var(--color-avoid-bg)] p-3">
          <p className="flex items-start gap-2 text-sm text-[var(--color-avoid)]">
            <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Nothing on this menu is safe for{" "}
              <strong>{plan.unfed.map((diner) => diner.label).join(", ")}</strong>.
              Ask staff whether the kitchen can prepare something off-menu.
            </span>
          </p>
        </div>
      )}

      {/* ── What was excluded, and why ── */}
      {notableRejections.length > 0 && (
        <details className="mt-3 border-t border-[var(--color-border)] pt-3">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-muted-foreground)]">
            Excluded from this order ({notableRejections.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {notableRejections.map((rejection) => (
              <li
                key={rejection.dishId}
                className="text-xs text-[var(--color-muted-foreground)]"
              >
                <span className="text-[var(--color-avoid)]">✕</span>{" "}
                {rejection.detail}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* ── Non-fatal problems ── */}
      {plan.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-[var(--color-border)] pt-3">
          {plan.warnings.map((warning) => (
            <li
              key={warning}
              className="flex items-start gap-1.5 text-xs text-[var(--color-caution)]"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              {warning}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted-foreground)]">
        Chosen by a unit-tested solver, not by the language model. Allergen
        conflicts are removed before selection begins, and the total never
        exceeds your budget.
      </p>
    </section>
  );
}
