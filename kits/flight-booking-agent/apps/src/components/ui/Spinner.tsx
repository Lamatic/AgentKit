"use client";

import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export const Spinner = ({
  size = "md",
  color = "text-blue-400",
  label,
}: SpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} ${color} animate-spin`} />
      {label && <p className="text-slate-400 text-sm">{label}</p>}
    </div>
  );
};
