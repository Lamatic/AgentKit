"use client";

import React from "react";
import MagnetLines from "@/components/ui/MagnetLines";

interface CTAProps {
  onOpenModal: () => void;
}

export function CTA({ onOpenModal }: CTAProps) {
  return (
    <section className="py-24 sm:py-32 border-b border-[#E2E2DF] relative overflow-hidden reveal-on-scroll bg-[#FFFFFF]">
      {/* Interactive MagnetLines background covering the entire CTA section screen area */}
      <div className="absolute inset-0 pointer-events-none opacity-25 flex items-center justify-center">
        <MagnetLines
          rows={9}
          columns={18}
          containerSize="100%"
          lineColor="#0D0D0B"
          lineWidth="0.8vmin"
          lineHeight="4vmin"
          baseAngle={0}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center relative z-10">
        {/* Centered 640px container with relative positioning & L-shaped corner markers */}
        <div className="relative w-full max-w-[640px] bg-[#F8F8F6] border border-[#0D0D0B] p-8 sm:p-12 text-center space-y-6 shadow-xl">
          {/* Technical L-shaped Corner Markers */}
          <div className="corner-marker-tl" />
          <div className="corner-marker-tr" />
          <div className="corner-marker-bl" />
          <div className="corner-marker-br" />

          {/* Section Tag */}
          <div className="inline-block px-3 py-1 bg-[#FCDD2D] border border-[#0D0D0B] font-mono text-[10px] text-[#0D0D0B] font-bold uppercase tracking-widest">
            [ ELEVATE YOUR SYSTEM ]
          </div>

          {/* Headline */}
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#0D0D0B] tracking-tight leading-tight">
            Ready to scale with confidence?
          </h2>

          {/* Subtext */}
          <p className="font-sans text-sm sm:text-base text-[#555550] max-w-md mx-auto leading-relaxed">
            Get your Architecture Evolution Report in minutes. Evaluated against enterprise scalability benchmarks.
          </p>

          {/* Primary CTA Button */}
          <div className="pt-2">
            <button
              onClick={onOpenModal}
              className="w-full sm:w-auto px-8 py-4 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-3 group"
            >
              <span>Analyze My Architecture</span>
              <span className="text-[#0D0D0B] group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>

          {/* Micro Footer text */}
          <div className="pt-2 font-mono text-[10px] uppercase tracking-wider text-[#888880] flex items-center justify-center gap-4">
            <span>NO CREDIT CARD REQUIRED</span>
            <span>·</span>
            <span>PDF &amp; MD EXPORT</span>
          </div>
        </div>
      </div>
    </section>
  );
}
