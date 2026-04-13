import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes with clsx and merges using tailwind-merge.
 * @param inputs Array of class values to merge.
 * @returns Merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random session ID with a timestamp.
 * @returns A unique session ID string.
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generates a random user ID for persistent memory.
 * @returns A unique user ID string.
 */
export function generateUserId(): string {
  return `user-${Math.random().toString(36).substring(2, 11)}`;
}
