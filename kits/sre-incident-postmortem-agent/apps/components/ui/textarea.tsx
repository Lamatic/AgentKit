import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "mt-2 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--heading)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
