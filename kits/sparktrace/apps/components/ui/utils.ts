/**
 * Tiny className joiner — deliberately dependency-free (no clsx/tailwind-merge)
 * so apps/components/ui/* compiles without extra packages being installed by
 * another module. Falsy values are skipped; later classes simply win via
 * normal CSS cascade / source order, same as clsx without the merge step.
 */
export function cn(...classes: Array<string | false | null | undefined | 0>): string {
  return classes.filter(Boolean).join(" ");
}
