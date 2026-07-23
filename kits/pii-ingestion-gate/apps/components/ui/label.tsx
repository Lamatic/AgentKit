import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Minimal shadcn/ui-style label. */
export const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-semibold text-slate-700", className)}
    {...props}
  />
));
Label.displayName = "Label";
