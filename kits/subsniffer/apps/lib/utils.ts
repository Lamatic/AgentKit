import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts with tailwind-merge.
 * @param inputs - Class values (strings, arrays, or conditionals) to merge.
 * @returns A single de-duplicated, conflict-resolved className string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
