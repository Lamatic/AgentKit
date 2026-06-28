import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "mt-2 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--heading)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
