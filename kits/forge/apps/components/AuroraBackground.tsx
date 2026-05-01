"use client";

import { useEffect, useRef, useState } from "react";

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const requestRef = useRef<number>();
  const currentPos = useRef({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position as percentage
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Spring physics for smooth orb tracking
  useEffect(() => {
    const updateOrb = () => {
      currentPos.current.x += (mousePos.x - currentPos.current.x) * 0.05;
      currentPos.current.y += (mousePos.y - currentPos.current.y) * 0.05;

      const interactiveOrb = document.getElementById("interactive-orb");
      if (interactiveOrb) {
        interactiveOrb.style.transform = `translate(calc(${currentPos.current.x}vw - 50%), calc(${currentPos.current.y}vh - 50%))`;
      }
      
      requestRef.current = requestAnimationFrame(updateOrb);
    };

    requestRef.current = requestAnimationFrame(updateOrb);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [mousePos]);

  return (
    <div className="relative min-h-screen w-full bg-[#050508] isolate">
      {/* Background Liquid Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none filter blur-[100px] opacity-60">
        {/* Orb 1: Floating top right */}
        <div 
          className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/30 animate-[spin_20s_linear_infinite]"
          style={{ animationDirection: "alternate" }}
        />
        
        {/* Orb 2: Floating bottom left */}
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/20 animate-[spin_25s_linear_infinite_reverse]"
        />
        
        {/* Orb 3: Interactive mouse follower */}
        <div 
          id="interactive-orb"
          className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-blue-500/20 mix-blend-screen"
          style={{ willChange: "transform" }}
        />
      </div>
      
      {/* Dark noise overlay for texture */}
      <div 
        className="absolute inset-0 z-[1] opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content Layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
