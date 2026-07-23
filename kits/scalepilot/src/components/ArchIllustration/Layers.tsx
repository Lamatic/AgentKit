import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ARCH_CONFIG } from "./constants";

interface LayersProps {
  isHovered: boolean;
}

// ----------------------------------------------------
// Layer 1: Infrastructure Layer (Matte Black Base)
// ----------------------------------------------------
export function InfrastructureLayer({ isHovered }: LayersProps) {
  const shouldReduceMotion = useReducedMotion();
  const layer = ARCH_CONFIG.LAYERS.L1;

  // Float animation configuration
  const floatAnim = shouldReduceMotion
    ? {}
    : {
        y: [0, 0], // L1 is grounded (amplitude 0px)
      };

  return (
    <motion.div
      animate={{
        z: isHovered ? layer.zHover : layer.zNormal,
        ...floatAnim,
      }}
      transition={{
        z: { type: "spring", stiffness: 120, damping: 22 },
        y: { duration: layer.floatSec, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
      }}
      className="absolute w-[220px] h-[220px] bg-[#111111] border border-[#222222] rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between p-3 select-none overflow-hidden"
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Yellow Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.22] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #FFD84D 1.2px, transparent 1.2px),
            linear-gradient(to bottom, #FFD84D 1.2px, transparent 1.2px)
          `,
          backgroundSize: "44px 44px",
          backgroundPosition: "center",
        }}
      />

      {/* Junction Nodes (Infrastructure hardware feel) */}
      <div className="absolute top-[44px] left-[44px] w-1.5 h-1.5 bg-[#FFD84D] rounded-full shadow-[0_0_6px_#FFD84D] opacity-80" />
      <div className="absolute top-[88px] left-[132px] w-1.5 h-1.5 bg-[#FFD84D] rounded-full shadow-[0_0_6px_#FFD84D] opacity-80" />
      <div className="absolute bottom-[44px] right-[44px] w-1.5 h-1.5 bg-[#FFD84D] rounded-full shadow-[0_0_6px_#FFD84D] opacity-80 animate-pulse" />

      {/* Matte metal corners/rivets */}
      <div className="flex justify-between w-full opacity-40 z-10">
        <div className="w-2 h-2 rounded-full border border-neutral-600 bg-neutral-800" />
        <div className="w-2 h-2 rounded-full border border-neutral-600 bg-neutral-800" />
      </div>
      <div className="flex justify-between w-full opacity-40 z-10">
        <div className="w-2 h-2 rounded-full border border-neutral-600 bg-neutral-800" />
        <div className="w-2 h-2 rounded-full border border-neutral-600 bg-neutral-800" />
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------
// Layer 2: Analytics Layer (Glassmorphism & Telemetry)
// ----------------------------------------------------
export function AnalyticsLayer({ isHovered }: LayersProps) {
  const shouldReduceMotion = useReducedMotion();
  const layer = ARCH_CONFIG.LAYERS.L2;

  const floatAnim = shouldReduceMotion
    ? {}
    : {
        y: [-layer.floatAmp, layer.floatAmp],
      };

  // Generate values for telemetry bar heights
  const barsLeft = [12, 28, 16, 20, 10, 24];
  const barsRight = [18, 10, 22, 14, 26, 8];

  return (
    <motion.div
      animate={{
        z: isHovered ? layer.zHover : layer.zNormal,
        ...floatAnim,
      }}
      transition={{
        z: { type: "spring", stiffness: 120, damping: 22 },
        y: { duration: layer.floatSec, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
      }}
      className="absolute w-[220px] h-[220px] bg-[#FFFFFF]/[0.03] backdrop-blur-[2px] border border-white/10 rounded-2xl flex flex-col justify-between p-4 select-none"
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Telemetry Metric Bars - Left */}
      <div className="flex items-end gap-1.5 h-10 w-full justify-start opacity-75 mt-2">
        {barsLeft.map((h, i) => (
          <div
            key={`bar-l-${i}`}
            className="w-1.5 rounded-t bg-gradient-to-t from-[#FFD84D]/10 to-[#FFD84D]/80 animate-telemetry-bar"
            style={{
              height: `${h}px`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Telemetry Metric Bars - Right */}
      <div className="flex items-end gap-1.5 h-10 w-full justify-end opacity-75 mb-2">
        {barsRight.map((h, i) => (
          <div
            key={`bar-r-${i}`}
            className="w-1.5 rounded-t bg-gradient-to-t from-[#FFD84D]/10 to-[#FFD84D]/80 animate-telemetry-bar"
            style={{
              height: `${h}px`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------
// Layer 3: Service Layer (Minimal White Panel)
// ----------------------------------------------------
export function ServiceLayer({ isHovered }: LayersProps) {
  const shouldReduceMotion = useReducedMotion();
  const layer = ARCH_CONFIG.LAYERS.L3;

  const floatAnim = shouldReduceMotion
    ? {}
    : {
        y: [-layer.floatAmp, layer.floatAmp],
      };

  return (
    <motion.div
      animate={{
        z: isHovered ? layer.zHover : layer.zNormal,
        ...floatAnim,
      }}
      transition={{
        z: { type: "spring", stiffness: 120, damping: 22 },
        y: { duration: layer.floatSec, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
      }}
      className="absolute w-[220px] h-[220px] bg-white border border-[#E2E2DF] rounded-2xl flex flex-col justify-between p-4 select-none"
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        boxShadow: "0 8px 32px 0 rgba(13, 13, 11, 0.05)",
      }}
    >
      {/* Clean microservice representation (Negative space priority) */}
      <div className="flex items-center justify-between w-full opacity-65">
        <div className="w-16 h-1 bg-[#111111]/80 rounded-full" />
        <div className="w-2.5 h-2.5 rounded-full border border-[#111111]/30" />
      </div>

      <div className="flex flex-col gap-2 w-full justify-center flex-1 py-4">
        {/* Simple minimal line structure representing services flow */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded bg-[#111111]/10 border border-[#111111]/20" />
          <div className="flex-1 h-[1px] bg-dashed bg-neutral-200 border-t border-dashed" />
          <div className="w-3 h-3 rounded-full bg-[#111111]/10 border border-[#111111]/20" />
        </div>
      </div>

      <div className="flex items-center justify-between w-full opacity-65">
        <div className="w-2.5 h-2.5 rounded-full border border-[#111111]/30" />
        <div className="w-10 h-1 bg-[#111111]/80 rounded-full" />
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------
// Layer 4: Application Layer (Yellow Accent & Logo)
// ----------------------------------------------------
export function ApplicationLayer({ isHovered }: LayersProps) {
  const shouldReduceMotion = useReducedMotion();
  const layer = ARCH_CONFIG.LAYERS.L4;

  const floatAnim = shouldReduceMotion
    ? {}
    : {
        y: [-layer.floatAmp, layer.floatAmp],
      };

  return (
    <motion.div
      animate={{
        z: isHovered ? layer.zHover : layer.zNormal,
        ...floatAnim,
      }}
      transition={{
        z: { type: "spring", stiffness: 120, damping: 22 },
        y: { duration: layer.floatSec, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
      }}
      className="absolute w-[220px] h-[220px] bg-gradient-to-br from-[#FFE47E] to-[#FFD84D] border border-white/20 rounded-2xl flex items-center justify-center select-none"
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        boxShadow: isHovered
          ? "0 20px 45px rgba(252, 221, 45, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
          : "0 12px 30px rgba(252, 221, 45, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {/* Rotating dashed ring */}
      <div
        className="absolute w-28 h-28 border border-dashed border-[#111111]/30 rounded-full animate-spin"
        style={{ animationDuration: "12s" }}
      />

      {/* Soft glowing ring */}
      <div className="absolute w-20 h-20 border border-[#111111]/10 rounded-full animate-pulse" />

      {/* Tiny orbit particles */}
      {!shouldReduceMotion && (
        <div className="absolute w-28 h-28 pointer-events-none">
          {/* Particle 1 */}
          <div className="absolute top-1/2 left-0 w-1.5 h-1.5 bg-[#111111] rounded-full -translate-y-1/2 animate-orbit-a" />
          {/* Particle 2 */}
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-[#111111] rounded-full -translate-x-1/2 animate-orbit-b" />
        </div>
      )}

      {/* SP Monogram Centered */}
      <div className="relative z-10 font-display text-[28px] font-bold text-[#111111] tracking-tighter select-none">
        SP
      </div>
    </motion.div>
  );
}
