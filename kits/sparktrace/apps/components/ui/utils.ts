import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * className joiner + Tailwind conflict resolver. `clsx` handles the falsy
 * filtering and conditional/array/object class-value forms; `twMerge`
 * (Tailwind v4-compatible) then resolves same-property Tailwind utility
 * conflicts so a later class (e.g. a caller override) wins regardless of
 * generated CSS source order — plain concatenation can't guarantee that.
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
