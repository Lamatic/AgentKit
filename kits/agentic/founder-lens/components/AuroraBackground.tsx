"use client";

import { useEffect, useRef, useState } from "react";

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // Handle the fluid aurora gradient tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      const limitedX = 20 + (x * 0.6);
      const limitedY = 20 + (y * 0.6);
      setMousePosition({ x: limitedX, y: limitedY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle the Canvas Dot Grid Warping
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const SPACING = 24; // Distance between dots
    const RADIUS = 1;   // Size of dot
    const COLOR = "rgba(255, 255, 255, 0.25)";
    
    // Warp configuration
    const WARP_RADIUS = 150; // How far the mouse affects dots
    const WARP_STRENGTH = 0.5; // How much they are pushed

    let mouseX = -1000;
    let mouseY = -1000;
    
    let dots: { originalX: number; originalY: number; x: number; y: number }[] = [];

    // Initialize dots grid
    const initDots = () => {
      dots = [];
      for (let x = 0; x < width; x += SPACING) {
        for (let y = 0; y < height; y += SPACING) {
          dots.push({ originalX: x, originalY: y, x, y });
        }
      }
    };

    initDots();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initDots();
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleCanvasMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleCanvasMouseMove);
    window.addEventListener("mouseleave", handleCanvasMouseLeave);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = COLOR;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        // Calculate distance to mouse
        const dx = mouseX - dot.originalX;
        const dy = mouseY - dot.originalY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate warp offset
        let targetX = dot.originalX;
        let targetY = dot.originalY;

        if (dist < WARP_RADIUS) {
          // Push dot away from mouse based on proximity
          const force = (WARP_RADIUS - dist) / WARP_RADIUS;
          targetX = dot.originalX - dx * force * WARP_STRENGTH;
          targetY = dot.originalY - dy * force * WARP_STRENGTH;
        }

        // Smoothly interpolate current position to target position (Spring physics)
        dot.x += (targetX - dot.x) * 0.15;
        dot.y += (targetY - dot.y) * 0.15;

        // Draw the dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleCanvasMouseMove);
      window.removeEventListener("mouseleave", handleCanvasMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden isolate">
      {/* Deep Background Gradient Blob */}
      <div className="aurora-bg">
        {/* Canvas overlays the absolute black root and draws the warping dots */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 z-[1] pointer-events-none" 
        />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
