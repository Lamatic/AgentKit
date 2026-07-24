'use client';

import { useRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../lib/utils';

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

export default function MagneticButton({ children, className, onMouseMove, onMouseLeave, ...props }: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const { clientX, clientY } = e;
      const { height, width, left, top } = buttonRef.current.getBoundingClientRect();
      const middleX = clientX - (left + width / 2);
      const middleY = clientY - (top + height / 2);
      setPosition({ x: middleX * 0.3, y: middleY * 0.3 }); // 0.3 pull strength
    }
    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const reset = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPosition({ x: 0, y: 0 });
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  return (
    <motion.button
      {...props}
      ref={buttonRef}
      className={cn("relative", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, mass: 0.1 }}
      suppressHydrationWarning
    >
      {children}
    </motion.button>
  );
}
