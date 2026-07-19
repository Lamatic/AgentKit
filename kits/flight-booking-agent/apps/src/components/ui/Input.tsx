"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = "", id, ...props }, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;
    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="text-sm text-slate-400 block mb-1">{label}</label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
          w-full px-4 py-2 bg-slate-700/50 border 
          ${error ? "border-red-500" : "border-slate-600"} 
          rounded-lg text-white placeholder-slate-500 
          focus:outline-none focus:border-blue-500 
          transition-colors disabled:opacity-50
          ${className}
        `}
          {...props}
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
