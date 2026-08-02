"use client";

import { Plus, X } from "lucide-react";
import { ALLERGEN_LABELS, ALL_ALLERGENS } from "@/lib/types";
import type { AllergenId, Budget, Diner, DietId, ServingModel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DIETS: Array<{ id: DietId; label: string }> = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "halal", label: "Halal" },
  { id: "gluten-free", label: "Gluten-free" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "INR", "BRL", "THB"];

interface PartyPanelProps {
  diners: Diner[];
  onDinersChange: (diners: Diner[]) => void;
  budget: Budget | null;
  onBudgetChange: (budget: Budget | null) => void;
  servingModel: ServingModel;
  onServingModelChange: (model: ServingModel) => void;
  disabled?: boolean;
}

/**
 * Who is eating, and how much they want to spend.
 *
 * This is the input the competition does not collect. Every menu-translation
 * app asks what language you read; none asks who is at the table or what the
 * bill can be. Both are hard constraints downstream, so both are first-class
 * here rather than buried in a settings screen.
 */
export function PartyPanel({
  diners,
  onDinersChange,
  budget,
  onBudgetChange,
  servingModel,
  onServingModelChange,
  disabled = false,
}: PartyPanelProps) {
  function updateDiner(id: string, patch: Partial<Diner>) {
    onDinersChange(
      diners.map((diner) => (diner.id === id ? { ...diner, ...patch } : diner))
    );
  }

  function addDiner() {
    const nextIndex = diners.length + 1;
    onDinersChange([
      ...diners,
      {
        // Date.now() collides when two diners are added inside the same
        // millisecond, and duplicate IDs make the solver count two people as
        // one. randomUUID has no such failure mode.
        id: crypto.randomUUID(),
        label: `Diner ${nextIndex}`,
        avoidAllergens: [],
        diet: null,
        dislikes: [],
      },
    ]);
  }

  function removeDiner(id: string) {
    onDinersChange(diners.filter((diner) => diner.id !== id));
  }

  function toggleAllergen(diner: Diner, allergen: AllergenId) {
    const has = diner.avoidAllergens.includes(allergen);
    updateDiner(diner.id, {
      avoidAllergens: has
        ? diner.avoidAllergens.filter((a) => a !== allergen)
        : [...diner.avoidAllergens, allergen],
    });
  }

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        Your table
      </h2>

      <div className="space-y-4">
        {diners.map((diner) => (
          <div
            key={diner.id}
            className="rounded-md border border-[var(--color-border)] p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <Input
                value={diner.label}
                onChange={(event) =>
                  updateDiner(diner.id, { label: event.target.value })
                }
                disabled={disabled}
                aria-label="Diner name"
                className="h-8 max-w-[12rem]"
              />
              {diners.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDiner(diner.id)}
                  disabled={disabled}
                  aria-label={`Remove ${diner.label}`}
                  className="ml-auto rounded p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <fieldset className="mb-3" disabled={disabled}>
              <legend className="mb-1.5 text-xs font-medium text-[var(--color-muted-foreground)]">
                Must avoid
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ALLERGENS.map((allergen) => {
                  const active = diner.avoidAllergens.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => toggleAllergen(diner, allergen)}
                      aria-pressed={active}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        active
                          ? "border-[var(--color-avoid-border)] bg-[var(--color-avoid-bg)] font-medium text-[var(--color-avoid)]"
                          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-muted-foreground)]"
                      }`}
                    >
                      {active ? "✕ " : ""}
                      {ALLERGEN_LABELS[allergen]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mb-3" disabled={disabled}>
              <legend className="mb-1.5 text-xs font-medium text-[var(--color-muted-foreground)]">
                Diet
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {DIETS.map((diet) => {
                  const active = diner.diet === diet.id;
                  return (
                    <button
                      key={diet.id}
                      type="button"
                      onClick={() =>
                        updateDiner(diner.id, { diet: active ? null : diet.id })
                      }
                      aria-pressed={active}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        active
                          ? "border-[var(--color-safe-border)] bg-[var(--color-safe-bg)] font-medium text-[var(--color-safe)]"
                          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-muted-foreground)]"
                      }`}
                    >
                      {diet.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Dislikes are a soft constraint: they surface as "caution" on a
                dish rather than removing it, unlike allergies and diets. */}
            <div>
              <Label
                htmlFor={`dislikes-${diner.id}`}
                className="mb-1.5 block text-xs font-medium text-[var(--color-muted-foreground)]"
              >
                Would rather avoid{" "}
                <span className="font-normal">(comma separated, optional)</span>
              </Label>
              <Input
                id={`dislikes-${diner.id}`}
                value={diner.dislikes.join(", ")}
                placeholder="coriander, olives"
                disabled={disabled}
                onChange={(event) =>
                  updateDiner(diner.id, {
                    dislikes: event.target.value
                      .split(",")
                      .map((entry) => entry.trim())
                      .filter((entry) => entry !== "")
                      .slice(0, 20),
                  })
                }
                className="h-8"
              />
            </div>
          </div>
        ))}
      </div>

      {diners.length < 8 && (
        <Button
          type="button"
          variant="outline"
          onClick={addDiner}
          disabled={disabled}
          className="mt-3 w-full"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add diner
        </Button>
      )}

      <div className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="budget-amount" className="mb-1.5 block text-xs">
            Budget for the table
          </Label>
          <div className="flex gap-2">
            <Input
              id="budget-amount"
              type="number"
              min={1}
              inputMode="decimal"
              placeholder="No limit"
              value={budget?.amount ?? ""}
              disabled={disabled}
              onChange={(event) => {
                const amount = Number(event.target.value);
                onBudgetChange(
                  event.target.value === "" || !Number.isFinite(amount) || amount <= 0
                    ? null
                    : { amount, currency: budget?.currency ?? "EUR" }
                );
              }}
              className="h-9"
            />
            <select
              aria-label="Budget currency"
              value={budget?.currency ?? "EUR"}
              disabled={disabled || budget === null}
              onChange={(event) =>
                budget && onBudgetChange({ ...budget, currency: event.target.value })
              }
              className="h-9 rounded-md border border-[var(--color-input)] bg-transparent px-2 text-sm disabled:opacity-50"
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset disabled={disabled}>
          <legend className="mb-1.5 text-xs font-medium">How you'll eat</legend>
          <div className="flex gap-1.5">
            {(["shared", "individual"] as const).map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => onServingModelChange(model)}
                aria-pressed={servingModel === model}
                className={`flex-1 rounded-md border px-2 py-2 text-xs transition-colors ${
                  servingModel === model
                    ? "border-[var(--color-ring)] bg-[var(--color-muted)] font-medium"
                    : "border-[var(--color-border)] text-[var(--color-muted-foreground)]"
                }`}
              >
                {model === "shared" ? "Sharing plates" : "Own plates"}
              </button>
            ))}
          </div>
          {servingModel === "shared" && (
            <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
              Sharing means an allergen on any plate is a risk to everyone, so
              those dishes are kept off the table entirely.
            </p>
          )}
        </fieldset>
      </div>
    </section>
  );
}
