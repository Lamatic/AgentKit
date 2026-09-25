import type { ReactNode } from "react";

type BadgeTone = "gray" | "green" | "amber" | "red" | "blue";

type StatusBadgeProps = {
  children: ReactNode;
  tone: BadgeTone;
};

const toneClassMap: Record<BadgeTone, string> = {
  gray: "border-slate-200 bg-slate-50 text-slate-600",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function StatusBadge({ children, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold tracking-[0.04em] ${toneClassMap[tone]}`}
    >
      {children}
    </span>
  );
}