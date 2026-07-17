"use client";

interface BadgeProps {
  variant?: "success" | "warning" | "error" | "info" | "default";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  success: "bg-green-500/20 text-green-400 border border-green-500/20",
  warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20",
  error: "bg-red-500/20 text-red-400 border border-red-500/20",
  info: "bg-blue-500/20 text-blue-400 border border-blue-500/20",
  default: "bg-slate-700/50 text-slate-300 border border-slate-600/30",
};

export const Badge = ({
  variant = "default",
  children,
  className = "",
}: BadgeProps) => {
  return (
    <span
      className={`
      text-xs px-2 py-0.5 rounded-full 
      ${variants[variant]}
      ${className}
    `}
    >
      {children}
    </span>
  );
};
