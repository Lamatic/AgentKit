"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 1.2,
  cooldownTime = 1.5,
  className,
  textClassName
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);
  const filterId = React.useId().replace(/:/g, '') + "-gooey-filter";
  const textsKey = JSON.stringify(texts);

  React.useEffect(() => {
    if (!texts || texts.length === 0) return;

    let textIndex = 0;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;
    let animationFrameId: number;

    // Set initial text content immediately
    if (text1Ref.current && text2Ref.current) {
      text1Ref.current.textContent = texts[0];
      text2Ref.current.textContent = texts[1 % texts.length];
      text1Ref.current.style.opacity = "100%";
      text1Ref.current.style.filter = "";
      text2Ref.current.style.opacity = "0%";
      text2Ref.current.style.filter = "";
    }

    const setMorph = (fraction: number) => {
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

        const invFraction = 1 - fraction;
        text1Ref.current.style.filter = `blur(${Math.min(8 / invFraction - 8, 100)}px)`;
        text1Ref.current.style.opacity = `${Math.pow(invFraction, 0.4) * 100}%`;
      }
    };

    const doCooldown = () => {
      morph = 0;
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = "";
        text2Ref.current.style.opacity = "100%";
        text1Ref.current.style.filter = "";
        text1Ref.current.style.opacity = "0%";
      }
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    };

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length];
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [textsKey, morphTime, cooldownTime]);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center w-full min-h-[160px] md:min-h-[220px] relative"
        style={{ filter: `url(#${filterId})` }}
      >
        <span
          ref={text1Ref}
          className={cn(
            "absolute left-0 right-0 w-full select-none text-center text-4xl sm:text-5xl md:text-[52pt] font-extrabold tracking-tighter whitespace-pre-line leading-none text-white",
            textClassName
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute left-0 right-0 w-full select-none text-center text-4xl sm:text-5xl md:text-[52pt] font-extrabold tracking-tighter whitespace-pre-line leading-none text-white",
            textClassName
          )}
        />
      </div>
    </div>
  );
}
