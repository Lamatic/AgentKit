import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Minimal shadcn/ui-style input. */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 aria-[invalid=true]:border-red-400",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
