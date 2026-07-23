import React, { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ARCH_CONFIG } from "./constants";
import {
  InfrastructureLayer,
  AnalyticsLayer,
  ServiceLayer,
  ApplicationLayer,
} from "./Layers";
import { FloatingCard } from "./FloatingCard";
import { Connector } from "./Connector";
import { AmbientGlow } from "./AmbientGlow";
import { NoiseOverlay } from "./NoiseOverlay";

export function ArchitectureStack() {
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for tracking mouse movement relative to card center (zero React re-renders)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for rotation & shift transitions
  const springConfig = { damping: 28, stiffness: 100, mass: 0.6 };
  
  // Maps coordinates to degrees of rotation (restricted to max tilt ARCH_CONFIG.MAX_TILT_DEG)
  const rotateX = useSpring(
    useTransform(
      mouseY,
      [-200, 200],
      [ARCH_CONFIG.DEFAULT_ROT_X + ARCH_CONFIG.MAX_TILT_DEG, ARCH_CONFIG.DEFAULT_ROT_X - ARCH_CONFIG.MAX_TILT_DEG]
    ),
    springConfig
  );

  const rotateZ = useSpring(
    useTransform(
      mouseX,
      [-200, 200],
      [ARCH_CONFIG.DEFAULT_ROT_Z - ARCH_CONFIG.MAX_TILT_DEG, ARCH_CONFIG.DEFAULT_ROT_Z + ARCH_CONFIG.MAX_TILT_DEG]
    ),
    springConfig
  );

  // Glow position shift maps (moves background glow slightly with mouse)
  const glowX = useSpring(useTransform(mouseX, [-200, 200], [-18, 18]), springConfig);
  const glowY = useSpring(useTransform(mouseY, [-200, 200], [-18, 18]), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    // Calculate offsets from the center of the illustration
    const x = event.clientX - rect.left - width / 2;
    const y = event.clientY - rect.top - height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <div
      className="relative w-full max-w-[480px] h-[400px] mx-auto overflow-visible select-none flex items-center justify-center cursor-pointer scale-90 sm:scale-100 transition-transform duration-500"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="3D System Architecture Illustration"
    >
      {/* 1. Ambient Glow (Blurred Background Lighting) */}
      <AmbientGlow glowX={glowX} glowY={glowY} isHovered={isHovered} />

      {/* 2. Curved Dotted Connectors & Blinking Nodes */}
      <Connector isHovered={isHovered} />

      {/* 3. 2D Floating Feature Label Cards (Standard read clarity, doesn't tilt in 3D) */}
      <FloatingCard position="top-left" label="Scalable" isHovered={isHovered} />
      <FloatingCard position="top-right" label="Reliable" isHovered={isHovered} />
      <FloatingCard position="bottom-left" label="High Performance" isHovered={isHovered} />
      <FloatingCard position="bottom-right" label="Production Ready" isHovered={isHovered} />

      {/* 4. 3D Isometric Stack Wrapper */}
      <motion.div
        className="relative w-[220px] h-[220px] flex items-center justify-center stack-container-3d"
        style={{
          perspective: `${ARCH_CONFIG.PERSPECTIVE}px`,
          transformStyle: "preserve-3d",
          rotateX: rotateX,
          rotateZ: rotateZ,
        }}
      >
        {/* Layer 1 (Bottom Infrastructure matte black base plate) */}
        <InfrastructureLayer isHovered={isHovered} />

        {/* Layer 2 (Analytics/Telemetry Glassmorphism) */}
        <AnalyticsLayer isHovered={isHovered} />

        {/* Layer 3 (Service minimal white card) */}
        <ServiceLayer isHovered={isHovered} />

        {/* Layer 4 (Top Application yellow gradient glow card) */}
        <ApplicationLayer isHovered={isHovered} />
      </motion.div>

      {/* 5. Tiled SVG Matte Noise Texture Overlay */}
      <NoiseOverlay />
    </div>
  );
}
export default ArchitectureStack;
