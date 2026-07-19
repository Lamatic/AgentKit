"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variants = {
  primary:
    "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/25",
  secondary:
    "bg-slate-700/50 text-white hover:bg-slate-600/50 border border-slate-600/30",
  ghost: "text-slate-400 hover:text-white hover:bg-slate-800/50",
  danger:
    "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

/**
 * Reusable button component with variants and loading state
 * @param children - Button content
 * @param loading - Shows spinner when true
 * @param variant - Button style variant (primary, secondary, ghost, danger)
 * @param size - Button size (sm, md, lg)
 * @param fullWidth - Makes button take full width
 * @param className - Optional additional CSS classes
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      loading = false,
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled = false,
      className = "",
      onClick,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        disabled={disabled || loading}
        onClick={onClick}
        className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        rounded-xl font-medium transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
        {...(props as any)} // ← Use type assertion to bypass the type issue
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
