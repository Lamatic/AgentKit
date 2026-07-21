"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);

  // Position coordinates
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth springs for the larger outer circle
  const springConfig = { damping: 30, stiffness: 220, mass: 0.6 };
  const outerX = useSpring(cursorX, springConfig);
  const outerY = useSpring(cursorY, springConfig);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "A" ||
          target.tagName === "BUTTON" ||
          target.closest("a") ||
          target.closest("button") ||
          target.getAttribute("role") === "button")
      ) {
        setIsHoveringClickable(true);
      } else {
        setIsHoveringClickable(false);
      }
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (!mounted) return null;

  return (
    <>
      {/* Global CSS to hide default system cursor only on hover-enabled screens */}
      <style jsx global>{`
        @media (hover: hover) {
          html,
          body,
          a,
          button,
          [role="button"] {
            cursor: none !important;
          }
        }
      `}</style>

      {/* Inner solid black dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-[#0D0D0B] rounded-full pointer-events-none z-[9999999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* Outer spring-animated black circle outline */}
      <motion.div
        className="fixed top-0 left-0 border-2 border-[#0D0D0B] rounded-full pointer-events-none z-[9999999]"
        animate={{
          width: isHoveringClickable ? 44 : 28,
          height: isHoveringClickable ? 44 : 28,
          backgroundColor: isHoveringClickable ? "rgba(13, 13, 11, 0.05)" : "rgba(13, 13, 11, 0)",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        style={{
          x: outerX,
          y: outerY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
export default CustomCursor;
