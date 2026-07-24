import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          // Variants
          variant === "default" && "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md",
          variant === "destructive" && "bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
          variant === "outline" && "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white",
          variant === "secondary" && "bg-slate-800 text-slate-200 hover:bg-slate-700",
          variant === "ghost" && "hover:bg-slate-800 hover:text-slate-100 text-slate-400",
          variant === "link" && "text-indigo-400 underline-offset-4 hover:underline",
          // Sizes
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 rounded-md px-3 text-xs",
          size === "lg" && "h-11 rounded-md px-8",
          size === "icon" && "h-9 w-9 p-0",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
