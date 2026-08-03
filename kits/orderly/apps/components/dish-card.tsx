"use client";

import { AlertTriangle, Ban, Check, HelpCircle } from "lucide-react";
import { dishVerdictForDiner } from "@/lib/allergen-engine";
import { formatPrice } from "@/lib/price";
import { ALLERGEN_LABELS } from "@/lib/types";
import type { Diner, EnrichedDish, Verdict } from "@/lib/types";

/**
 * Verdict presentation.
 *
 * Each verdict carries an icon, a word, and a colour — three redundant signals.
 * Colour alone would be unreadable to a colour-blind diner, and this is the
 * part of the interface where being misread has consequences.
 */
const VERDICT_STYLES: Record<
  Verdict,
  { label: string; icon: typeof Check; className: string }
> = {
  safe: {
    label: "Safe",
    icon: Check,
    className:
      "border-[var(--color-safe-border)] bg-[var(--color-safe-bg)] text-[var(--color-safe)]",
  },
  caution: {
    label: "Check",
    icon: AlertTriangle,
    className:
      "border-[var(--color-caution-border)] bg-[var(--color-caution-bg)] text-[var(--color-caution)]",
  },
  avoid: {
    label: "Avoid",
    icon: Ban,
    className:
      "border-[var(--color-avoid-border)] bg-[var(--color-avoid-bg)] text-[var(--color-avoid)]",
  },
};

/** The worst verdict across the party — what the card leads with. */
function tableVerdict(dish: EnrichedDish, diners: readonly Diner[]): Verdict {
  const verdicts = diners.map((diner) => dishVerdictForDiner(dish, diner).verdict);
  if (verdicts.includes("avoid")) return "avoid";
  if (verdicts.includes("caution")) return "caution";
  return "safe";
}

interface DishCardProps {
  dish: EnrichedDish;
  diners: Diner[];
}

export function DishCard({ dish, diners }: DishCardProps) {
  const verdict = tableVerdict(dish, diners);
  const style = VERDICT_STYLES[verdict];
  const Icon = style.icon;

  const perDiner = diners.map((diner) => ({
    diner,
    ...dishVerdictForDiner(dish, diner),
  }));

  return (
    <article className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="script-original font-medium leading-tight">
            {dish.nameOriginal}
          </h3>
          {dish.nameTransliterated && dish.nameTransliterated !== dish.nameOriginal && (
            <p className="text-sm italic text-[var(--color-muted-foreground)]">
              {dish.nameTransliterated}
            </p>
          )}
          {dish.nameTranslated && dish.nameTranslated !== dish.nameOriginal && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {dish.nameTranslated}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${style.className}`}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {style.label}
          </span>
          <span className="text-sm tabular-nums">
            {dish.price === null ? (
              <span className="text-[var(--color-muted-foreground)]">
                {dish.priceRaw?.trim() || "no price"}
              </span>
            ) : (
              formatPrice(dish.price)
            )}
          </span>
        </div>
      </div>

      {dish.description && (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {dish.description}
        </p>
      )}

      {dish.unreadable && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-caution)]">
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
          This line could not be read reliably, so it was left out of the order.
        </p>
      )}

      {dish.allergens.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {dish.allergens.map((hit) => (
            <li
              key={hit.allergen}
              className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-xs"
              // "contains" is what the restaurant printed. "may contain" is our
              // inference from the dish name. The wording is the honest part.
              title={`matched on "${hit.matchedIngredient}"`}
            >
              {hit.certainty === "contains" ? (
                <strong className="font-semibold">Contains</strong>
              ) : (
                <em className="not-italic text-[var(--color-muted-foreground)]">
                  May contain
                </em>
              )}{" "}
              {ALLERGEN_LABELS[hit.allergen]}
            </li>
          ))}
        </ul>
      )}

      {perDiner.some((entry) => entry.reasons.length > 0) && (
        <ul className="mt-2.5 space-y-1 border-t border-[var(--color-border)] pt-2.5">
          {perDiner
            .filter((entry) => entry.reasons.length > 0)
            .map((entry) => (
              <li
                key={entry.diner.id}
                className={`text-xs ${
                  entry.verdict === "avoid"
                    ? "text-[var(--color-avoid)]"
                    : "text-[var(--color-caution)]"
                }`}
              >
                {entry.reasons[0]}
              </li>
            ))}
        </ul>
      )}
    </article>
  );
}
