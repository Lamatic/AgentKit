import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
};

/** Minimal shadcn/ui-style button (no Radix dependency needed). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700",
        variant === "ghost" &&
          "text-slate-500 hover:text-slate-900 font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
