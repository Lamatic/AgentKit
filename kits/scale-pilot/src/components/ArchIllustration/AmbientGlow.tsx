import React from "react";
import { motion, MotionValue } from "framer-motion";

interface AmbientGlowProps {
  glowX: MotionValue<number>;
  glowY: MotionValue<number>;
  isHovered: boolean;
}

export function AmbientGlow({ glowX, glowY, isHovered }: AmbientGlowProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-visible flex items-center justify-center" aria-hidden="true">
      {/* Large background ambient glow - moves slightly with mouse */}
      <motion.div
        className="absolute w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] rounded-full bg-[#FFD84D]/10 blur-[80px] transition-all duration-300"
        style={{
          x: glowX,
          y: glowY,
          scale: isHovered ? 1.15 : 1.0,
          opacity: isHovered ? 0.95 : 0.75,
        }}
      />

      {/* Small focused under-light, centered beneath the stack */}
      <div
        className="absolute w-[180px] sm:w-[240px] h-[180px] sm:h-[240px] rounded-full bg-[#FFD84D]/12 blur-[40px] transition-all duration-300"
        style={{
          transform: `translate3d(0, 0, -20px) scale(${isHovered ? 1.2 : 1.0})`,
          opacity: isHovered ? 0.9 : 0.6,
        }}
      />
    </div>
  );
}
