// components/RiskMeter.tsx
"use client";

import { motion } from "framer-motion";
import { clamp } from "@/lib/utils";

interface RiskMeterProps {
  value: number; // 0-100
  label?: string;
}

/**
 * Animated SVG half-circle gauge that visualises a 0–100 risk score.
 *
 * Draws a static grey track arc and an animated coloured arc whose length
 * corresponds to the clamped risk value.  Colour transitions through green
 * → yellow → orange → red as the score increases.  The numeric score is
 * overlaid in the centre of the arc and animates in after the arc completes.
 *
 * @param value - Risk score in the 0–100 range; values outside this range
 *   are clamped by `clamp()` before rendering.
 * @param label - Text label displayed beneath the gauge (default `"Risk Score"`).
 * @returns A flex column containing the SVG gauge and its label.
 */
export default function RiskMeter({ value, label = "Risk Score" }: RiskMeterProps) {
  const clamped = clamp(value);

  // SVG arc parameters
  const radius = 70;
  const strokeWidth = 10;
  const center = 90;
  const circumference = Math.PI * radius; // half circle = π * r

  // Color gradient based on value
  const color =
    clamped >= 80
      ? "#f87171" // red-400
      : clamped >= 60
      ? "#fb923c" // orange-400
      : clamped >= 40
      ? "#facc15" // yellow-400
      : "#4ade80"; // green-400

  const trackColor = "rgba(255,255,255,0.06)";

  // dashoffset for the arc (0 = full, circumference = empty)
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: 180, height: 100 }}
        role="meter"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg
          width={180}
          height={100}
          viewBox="0 0 180 100"
          overflow="visible"
        >
          {/* Track arc */}
          <path
            d={`M ${center - radius},${center} A ${radius},${radius} 0 0,1 ${center + radius},${center}`}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Animated value arc */}
          <motion.path
            d={`M ${center - radius},${center} A ${radius},${radius} 0 0,1 ${center + radius},${center}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <motion.span
            className="text-3xl font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {clamped}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">
        {label}
      </span>
    </div>
  );
}
