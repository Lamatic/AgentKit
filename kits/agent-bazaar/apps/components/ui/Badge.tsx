import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default: "bg-primary-light text-primary",
      success: "bg-status-green-bg text-status-green",
      warning: "bg-status-amber-bg text-status-amber",
      error: "bg-status-red-bg text-status-red",
      outline: "border border-hairline text-neutral-500",
    };

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
