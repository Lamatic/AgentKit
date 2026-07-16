// components/Badge.tsx
"use client";

interface BadgeProps {
  label: string;
  colorClass?: string;
  size?: "sm" | "md";
}

/**
 * Small pill-shaped label badge used throughout the result cards to display
 * categorised text values (e.g. indicator levels, evidence items).
 *
 * @param label      - Text content to display inside the badge.
 * @param colorClass - Tailwind CSS class string for background, text, and
 *   border colours.  Defaults to a neutral slate palette.
 * @param size       - `"sm"` (default) renders at `text-xs`, `"md"` at `text-sm`.
 * @returns A styled `<span>` badge element.
 */
export default function Badge({
  label,
  colorClass = "bg-slate-700/60 text-slate-300 border border-slate-600/40",
  size = "sm",
}: BadgeProps) {
  const sizeClass =
    size === "sm"
      ? "px-2.5 py-1 text-xs"
      : "px-3 py-1.5 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${colorClass} whitespace-nowrap`}
    >
      {label}
    </span>
  );
}
