import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none ring-[var(--ring)]/30 placeholder:text-[var(--muted)] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
