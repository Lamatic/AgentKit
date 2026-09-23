import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    let variantStyles =
      "bg-brand-red hover:bg-brand-red/90 text-brand-white font-semibold border border-brand-red";

    if (variant === "ghost") {
      variantStyles =
        "bg-transparent text-neutral-400 hover:text-brand-white border-transparent";
    } else if (variant === "outline") {
      variantStyles =
        "border border-neutral-700 bg-transparent text-brand-white hover:bg-neutral-800";
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm transition duration-200 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
