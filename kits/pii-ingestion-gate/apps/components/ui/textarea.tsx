import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Minimal shadcn/ui-style textarea. */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-y rounded-lg border border-slate-200 p-3 font-mono text-sm outline-none focus:border-slate-400 aria-[invalid=true]:border-red-400",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
