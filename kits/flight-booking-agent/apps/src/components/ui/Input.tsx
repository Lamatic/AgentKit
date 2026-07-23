"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-muted-foreground block mb-1"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`
            w-full px-4 py-2 bg-muted/50 border 
            ${error ? "border-destructive" : "border-border"} 
            rounded-lg text-foreground placeholder-muted-foreground 
            focus:outline-none focus:border-primary 
            transition-colors disabled:opacity-50
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-destructive text-sm mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
