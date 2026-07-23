"use client";

import React from "react";
import { motion } from "framer-motion";
import { TextRoll } from "./TextRoll";
import { ArchitectureStack } from "./ArchIllustration";


interface HeroProps {
  onOpenModal: () => void;
  onSelectSampleReport?: () => void;
}

export function Hero({ onOpenModal, onSelectSampleReport }: HeroProps) {
  return (
    <section id="hero-section" className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center border-b border-[#E2E2DF] overflow-hidden bg-[#FFFFFF] py-6 lg:py-0">
      {/* Dark Faded Grid Overlay Layer (z-0: behind the pulse glow) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-45"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(13, 13, 11, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(13, 13, 11, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
        }}
      />

      {/* Richer, deeper ambient pulsing glow in center using #C89B0C (z-[2]: on top of grid) */}
      <div className="absolute top-1/2 left-1/2 w-[650px] sm:w-[850px] h-[350px] sm:h-[450px] bg-[#C89B0C] blur-[100px] pointer-events-none rounded-full animate-glow-pulse z-[2]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="font-display text-4xl sm:text-6xl lg:text-6xl font-bold text-[#0D0D0B] tracking-tight leading-[1.08]"
            >
              Your Architecture,{" "}
              <span className="inline-block bg-[#0D0D0B] text-[#FCDD2D] px-3 py-0.5 border border-[#0D0D0B] align-middle mt-1 lg:mt-0">
                <TextRoll className="text-[#FCDD2D]">evolved.</TextRoll>
              </span>
            </motion.h1>

            {/* Subheadline Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="text-lg text-[#555550] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans"
            >
              Upload your backend stack, schema, or system parameters. Receive a
              <strong className="text-[#0D0D0B] font-semibold"> zero-fluff, production-grade evolution report</strong> designed to survive your next 10x traffic spike.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                onClick={onOpenModal}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer shadow-none flex items-center justify-center gap-2 group"
              >
                <span>Analyze Your Architecture</span>
                <span className="text-[#0D0D0B] group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>

              {onSelectSampleReport && (
                <button
                  onClick={onSelectSampleReport}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#FFFFFF] hover:bg-[#F8F8F6] text-[#0D0D0B] border border-[#0D0D0B] font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer shadow-none text-center"
                >
                  See a Sample Report
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Column: Premium 3D Architecture Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 w-full flex items-center justify-center overflow-visible"
          >
            <ArchitectureStack />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
