// components/Badge.tsx
"use client";

interface BadgeProps {
  label: string;
  colorClass?: string;
  size?: "sm" | "md";
}

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
