'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CursorGlow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'a' || target.closest('button') || target.closest('a')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-12 h-12 rounded-full pointer-events-none z-[100] mix-blend-screen"
      animate={{
        x: mousePosition.x - 24,
        y: mousePosition.y - 24,
        scale: isHovering ? 1.5 : 1,
        backgroundColor: isHovering ? 'rgba(59, 130, 246, 0.4)' : 'rgba(147, 197, 253, 0.15)',
      }}
      transition={{
        type: 'spring',
        damping: 40,
        stiffness: 300,
        mass: 0.5,
      }}
    >
      <div className="absolute inset-0 rounded-full blur-[20px] bg-inherit" />
    </motion.div>
  );
}
