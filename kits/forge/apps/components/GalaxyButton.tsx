"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface GalaxyButtonProps {
  href?: string;
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function GalaxyButton({ href, text, onClick, disabled }: GalaxyButtonProps) {
  // Deterministic pseudo-random generator based on index to avoid hydration mismatch
  const pseudoRandom = (seed: number, min: number, max: number) => {
    const x = Math.sin(seed++) * 10000;
    const rand = x - Math.floor(x);
    return Math.floor(rand * (max - min + 1) + min);
  };

  const staticStars = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      angle: pseudoRandom(i * 10, 0, 360),
      duration: pseudoRandom(i * 10 + 1, 6, 20),
      delay: pseudoRandom(i * 10 + 2, 1, 10),
      alpha: pseudoRandom(i * 10 + 3, 40, 90) / 100,
      size: pseudoRandom(i * 10 + 4, 2, 6),
      distance: pseudoRandom(i * 10 + 5, 40, 200),
    }));
  }, []);

  const orbitingStars = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      angle: pseudoRandom(i * 20 + 100, 0, 360),
      duration: pseudoRandom(i * 20 + 101, 6, 20),
      delay: pseudoRandom(i * 20 + 102, 1, 10),
      alpha: pseudoRandom(i * 20 + 103, 40, 90) / 100,
      size: pseudoRandom(i * 20 + 104, 2, 6),
      distance: pseudoRandom(i * 20 + 105, 40, 200),
    }));
  }, []);

  const ButtonContent = (
    <button className={`galaxy-btn-core ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={onClick} disabled={disabled}>
        <span className="galaxy-backdrop"></span>
        <span className="galaxy-spark-mask">
          <span className="galaxy-spark"></span>
        </span>
        
        <span className="galaxy__container">
          {staticStars.map((style, i) => (
            <span
              key={i}
              className="galaxy-star galaxy-star--static"
              style={{
                '--angle': `${style.angle}deg`,
                '--duration': `${style.duration}s`,
                '--delay': `${style.delay}s`,
                '--alpha': style.alpha,
                '--size': `${style.size}px`,
                '--distance': `${style.distance}px`,
              } as React.CSSProperties}
            ></span>
          ))}
        </span>
        
        <span className="galaxy">
          <span className="galaxy__ring">
            {orbitingStars.map((style, i) => (
              <span
                key={i}
                className="galaxy-star"
                style={{
                  '--angle': `${style.angle}deg`,
                  '--duration': `${style.duration}s`,
                  '--delay': `${style.delay}s`,
                  '--alpha': style.alpha,
                  '--size': `${style.size}px`,
                  '--distance': `${style.distance}px`,
                } as React.CSSProperties}
              ></span>
            ))}
          </span>
        </span>
        
        <span className="galaxy-text flex items-center gap-2">
          {text}
          <ArrowRight className="w-5 h-5 text-current opacity-80" />
        </span>
      </button>
  );

  if (href) {
    return (
      <Link href={href} className="galaxy-button group inline-block">
        {ButtonContent}
      </Link>
    );
  }

  return (
    <div className="galaxy-button group inline-block">
      {ButtonContent}
    </div>
  );
}
