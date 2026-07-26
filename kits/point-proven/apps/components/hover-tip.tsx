"use client";

import { useId, type ReactNode } from "react";

/** CSS-only hover/focus tooltip — no click required. */
export function HoverTip({
  tip,
  children,
  className = "",
  side = "bottom",
}: {
  tip: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
}) {
  const tipId = useId();
  const pos =
    side === "top"
      ? "bottom-full mb-1.5"
      : "top-full mt-1.5";

  return (
    <span
      className={`relative inline-flex group/tip ${className}`}
      tabIndex={0}
      aria-describedby={tipId}
    >
      {children}
      <span
        id={tipId}
        role="tooltip"
        className={`pointer-events-none absolute left-0 z-20 ${pos} w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border bg-popover px-3 py-2 text-left text-xs leading-relaxed text-popover-foreground shadow-md opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100`}
      >
        {tip}
      </span>
    </span>
  );
}
