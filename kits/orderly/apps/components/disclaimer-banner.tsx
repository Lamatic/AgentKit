import { AlertTriangle } from "lucide-react";

/**
 * The persistent safety disclaimer.
 *
 * Deliberately not dismissible and deliberately at the top of the page rather
 * than in a footer. This app infers allergens from a photograph of a menu; the
 * inference is good enough to be useful and nowhere near good enough to be
 * relied on alone. Anyone reading a result needs to be looking at that sentence
 * at the same time.
 */
export function DisclaimerBanner() {
  return (
    <div
      role="note"
      className="border-b border-[var(--color-caution-border)] bg-[var(--color-caution-bg)] px-4 py-2.5"
    >
      <div className="mx-auto flex max-w-4xl items-start gap-2.5">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-caution)]"
          aria-hidden="true"
        />
        <p className="text-sm leading-snug text-[var(--color-caution)]">
          <strong className="font-semibold">AI-assisted, not medical advice.</strong>{" "}
          Allergens are inferred from a photo of the menu and can be wrong or
          incomplete. Always confirm with restaurant staff before ordering. This
          app never claims a dish is allergen-free.
        </p>
      </div>
    </div>
  );
}
