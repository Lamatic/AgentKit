import React from "react";
import { Database, Shield, BarChart3, Users } from "lucide-react";

export type CardPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface FloatingCardProps {
  position: CardPosition;
  label: string;
  isHovered: boolean;
}

export function FloatingCard({ position, label, isHovered }: FloatingCardProps) {
  // Select icon based on position
  const getIcon = () => {
    switch (position) {
      case "top-left":
        return <Database className="w-4 h-4 text-[#111111]" />;
      case "top-right":
        return <Shield className="w-4 h-4 text-[#111111]" />;
      case "bottom-left":
        return <BarChart3 className="w-4 h-4 text-[#111111]" />;
      case "bottom-right":
        return <Users className="w-4 h-4 text-[#111111]" />;
    }
  };

  // Determine alignment classes
  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4 sm:left-8 md:left-2 animate-float-slow";
      case "top-right":
        return "top-4 right-4 sm:right-8 md:right-2 animate-float-medium";
      case "bottom-left":
        return "bottom-4 left-4 sm:left-8 md:left-2 animate-float-fast";
      case "bottom-right":
        return "bottom-4 right-4 sm:right-8 md:right-2 animate-float-slowest";
    }
  };

  return (
    <div
      className={`absolute z-30 flex items-center gap-2.5 bg-white border border-[#E2E2DF] px-3.5 py-2 shadow-[0_4px_12px_rgba(13,13,11,0.04)] transition-all duration-300 pointer-events-none hover:shadow-[0_8px_20px_rgba(13,13,11,0.08)] ${getPositionClasses()}`}
      style={{
        transform: `translateZ(10px) scale(${isHovered ? 1.03 : 1.0})`,
      }}
    >
      {/* Icon Wrapper */}
      <div className="flex items-center justify-center w-7 h-7 bg-[#F8F8F6] border border-[#E2E2DF] rounded-md">
        {getIcon()}
      </div>

      {/* Label Text */}
      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#111111]">
        {label}
      </span>
    </div>
  );
}
