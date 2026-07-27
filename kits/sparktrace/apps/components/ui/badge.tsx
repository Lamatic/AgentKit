import * as React from "react";
import { cn } from "./utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "destructive"
  | "warning"
  | "slate"
  | "violet";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
  success:
    "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  destructive: "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
  warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  slate: "border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-300",
  violet: "border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
