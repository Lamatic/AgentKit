'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const scaleValue = useMotionValue(1);

  const x = useSpring(rawX, { stiffness: 300, damping: 40, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 300, damping: 40, mass: 0.5 });
  const scale = useSpring(scaleValue, { stiffness: 300, damping: 40, mass: 0.5 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      rawX.set(e.clientX - 24);
      rawY.set(e.clientY - 24);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'a' || target.closest('button') || target.closest('a')) {
        scaleValue.set(1.5);
      } else {
        scaleValue.set(1);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [rawX, rawY, scaleValue]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-12 h-12 rounded-full pointer-events-none z-[100] mix-blend-screen bg-blue-400/20"
      style={{
        x,
        y,
        scale,
      }}
    >
      <div className="absolute inset-0 rounded-full blur-[20px] bg-inherit" />
    </motion.div>
  );
}
