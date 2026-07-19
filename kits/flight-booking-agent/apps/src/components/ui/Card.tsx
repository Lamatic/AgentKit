"use client";

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  hoverable?: boolean;
  variant?: "default" | "glass" | "dark";
}

const variants = {
  default: "bg-slate-800/40 border border-slate-700/30",
  glass: "bg-slate-800/40 backdrop-blur-sm border border-slate-700/30",
  dark: "bg-slate-800 border border-slate-700",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      hoverable = false,
      variant = "glass",
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        className={`
        ${variants[variant]}
        ${hoverable ? "hover:border-blue-500/30 hover:bg-slate-800/60 transition-all duration-300 cursor-pointer" : ""}
        rounded-2xl p-5
        ${className}
      `}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Card.displayName = "Card";
