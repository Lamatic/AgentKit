import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
        variant === "default" && "border-transparent bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        variant === "secondary" && "border-transparent bg-slate-800 text-slate-200",
        variant === "destructive" && "border-transparent bg-rose-500/10 text-rose-400 border-rose-500/20",
        variant === "success" && "border-transparent bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        variant === "warning" && "border-transparent bg-amber-500/10 text-amber-400 border-amber-500/20",
        variant === "outline" && "text-slate-400 border-slate-700/50",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
