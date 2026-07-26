"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  hoverable?: boolean;
  variant?: "default" | "glass" | "dark";
  children?: React.ReactNode;
}

const variants = {
  default: "bg-card border border-border",
  glass: "bg-card/40 backdrop-blur-sm border border-border",
  dark: "bg-card border border-border",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
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
        className={cn(
          variants[variant],
          "rounded-xl p-5 shadow-sm",
          hoverable &&
            "hover:shadow-md hover:bg-muted/30 transition-all duration-300 cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Card.displayName = "Card";
