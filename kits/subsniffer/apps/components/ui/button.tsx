import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline";

export function Button({
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "outline"
          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          : "bg-indigo-600 text-white hover:bg-indigo-500",
        className,
      )}
      {...props}
    />
  );
}
