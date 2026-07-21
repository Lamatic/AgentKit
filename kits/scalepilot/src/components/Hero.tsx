"use client";

import React from "react";
import { motion } from "framer-motion";
import { TextRoll } from "./TextRoll";

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
            {/* System Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F8F8F6] border border-[#E2E2DF] font-mono text-[11px] text-[#0D0D0B] uppercase tracking-wider"
            >
              <span className="w-2 h-2 rounded-full bg-[#89FA91] border border-[#0D0D0B] animate-pulse" />
              <span>AI ARCHITECTURE CONSULTANT FOR SCALING ENGINES</span>
            </motion.div>

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

          {/* Right Column: Interactive Architecture Report Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 w-full"
          >
            <div className="bg-[#141412] text-[#F7F7F5] border border-[#0D0D0B] p-6 space-y-5 shadow-2xl relative">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between border-b border-[#2A2A28] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E55836]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FCDD2D]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#89FA91]" />
                  <span className="font-mono text-[10px] text-[#A0A09A] uppercase tracking-wider ml-2">
                    REPORT_PREVIEW.MD
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#70706A] uppercase font-bold">
                  CONFIDENTIAL
                </span>
              </div>

              {/* Health Score Summary */}
              <div className="bg-[#1D1D1B] border border-[#2A2A28] p-4 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] text-[#A0A09A] uppercase">
                    SYSTEM HEALTH SCORE
                  </div>
                  <div className="font-display text-3xl font-bold text-[#F7F7F5]">
                    74 <span className="text-xs text-[#70706A]">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-[#FCDD2D] text-[#0D0D0B] font-mono text-[10px] font-bold uppercase border border-[#0D0D0B]">
                    MODERATE RISK
                  </span>
                  <div className="font-mono text-[9px] text-[#A0A09A] mt-1">
                    3 HIGH PRIORITY ISSUES
                  </div>
                </div>
              </div>

              {/* Executive Analysis Code Snippet */}
              <div className="font-mono text-xs space-y-2 bg-[#0D0D0B] p-4 border border-[#2A2A28]">
                <div className="text-[#70706A] text-[10px] uppercase">
                  {/* EXECUTIVE ANALYSIS SNIPPET */}
                </div>
                <div className="text-[#89FA91]">
                  &gt; STACK: Node.js / PostgreSQL / AWS ECS / 120k MAU
                </div>
                <div className="text-[#E55836]">
                  [RISK 01] Single DB instance writes saturated during peak hour.
                </div>
                <div className="text-[#FCDD2D]">
                  [INSIGHT] Synchronous REST calls causing cascading p99 delay (3.2s).
                </div>
                <div className="text-[#F7F7F5]">
                  [REC] Phase 1: Decouple event bus with NATS. Add read-replica node.
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="flex items-center justify-between font-mono text-[10px] text-[#A0A09A] pt-1">
                <span className="flex items-center gap-1.5 text-[#89FA91]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#89FA91]" />
                  ANALYSIS COMPLETE
                </span>
                <span className="text-[#70706A]">ID: #SP-8942-ARCH</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
