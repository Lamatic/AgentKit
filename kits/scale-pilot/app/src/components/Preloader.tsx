"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PreloaderProps {
  onFinish?: () => void;
}

const PHASES = [
  {
    id: "01",
    name: "UNDERSTANDING",
    minProgress: 0,
    maxProgress: 23,
    title: "Stack & Concurrency Ingestion",
    detail: "Parsing runtime services, primary database engines, and operational traffic spikes.",
  },
  {
    id: "02",
    name: "ANALYSIS",
    minProgress: 24,
    maxProgress: 55,
    title: "Deep Architectural Bottleneck Audit",
    detail: "Evaluating single points of failure, query locks, and P99 latency degradation boundaries.",
  },
  {
    id: "03",
    name: "PLANNING",
    minProgress: 56,
    maxProgress: 78,
    title: "Phase 1-3 Zero-Downtime Roadmap",
    detail: "Structuring event bus migration, read replicas, and infrastructure trade-off matrix.",
  },
  {
    id: "04",
    name: "REPORT GENERATION",
    minProgress: 79,
    maxProgress: 100,
    title: "Principal Architect Deliverable Compilation",
    detail: "Compiling executive summary, cost benchmarks, and production-ready evolution report.",
  },
];

export function Preloader({ onFinish }: PreloaderProps) {
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    const animateTo = (from: number, to: number, durationMs: number) => {
      return new Promise<void>((resolve) => {
        const start = performance.now();
        const step = (now: number) => {
          if (isCancelled) return;
          const elapsed = now - start;
          const ratio = Math.min(elapsed / durationMs, 1);
          const currentVal = Math.round(from + (to - from) * ratio);
          setProgress(currentVal);

          if (ratio < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const runPhaseSequence = async () => {
      // Phase 1: Count 0% -> 23%, then PAUSE 0.7 SECONDS at 23%
      await animateTo(0, 23, 400);
      if (isCancelled) return;
      await sleep(700);
      if (isCancelled) return;

      // Phase 2: Count 23% -> 55%, then PAUSE 0.7 SECONDS at 55%
      await animateTo(23, 55, 500);
      if (isCancelled) return;
      await sleep(700);
      if (isCancelled) return;

      // Phase 3: Count 55% -> 78%, then PAUSE 0.7 SECONDS at 78%
      await animateTo(55, 78, 400);
      if (isCancelled) return;
      await sleep(700);
      if (isCancelled) return;

      // Phase 4: Count 78% -> 100%, then HOLD 400MS at 100%
      await animateTo(78, 100, 400);
      if (isCancelled) return;
      await sleep(400);
      if (isCancelled) return;

      // Finish & reveal Hero section
      setIsComplete(true);
    };

    runPhaseSequence();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Lock document body & root scroll while preloader is active to prevent scrollbars or margin leakage
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalMargin = document.body.style.margin;
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.margin = originalMargin;
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Determine current active phase index (0, 1, 2, or 3)
  const currentPhaseIndex = PHASES.findIndex(
    (p) => progress >= p.minProgress && progress <= p.maxProgress
  ) !== -1
    ? PHASES.findIndex((p) => progress >= p.minProgress && progress <= p.maxProgress)
    : progress > 78
    ? 3
    : 0;

  const currentPhase = PHASES[currentPhaseIndex];

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {!isComplete && (
        <motion.div
          key="scalepilot-phase-pause-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-w-full min-h-full z-[999999] bg-[#FFFFFF] flex flex-col justify-between p-6 sm:p-12 text-[#0D0D0B] select-none overflow-hidden"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            maxWidth: "100vw",
            maxHeight: "100vh",
          }}
        >
          {/* Technical L-shaped Corner Markers */}
          <div className="corner-marker-tl" />
          <div className="corner-marker-tr" />
          <div className="corner-marker-bl" />
          <div className="corner-marker-br" />

          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FCDD2D] border border-[#0D0D0B] flex items-center justify-center font-mono font-bold text-xs text-[#0D0D0B]">
                SP
              </div>
              <span className="font-display font-bold text-lg text-[#0D0D0B] tracking-tight">
                ScalePilot
              </span>
            </div>
          </div>

          {/* Center Content: 4-Phase Information Revealing Display */}
          <div className="max-w-3xl mx-auto w-full my-auto py-8 space-y-8">
            {/* Top Progress & Percentage */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E2DF] pb-6">
              <div className="space-y-1">
                <span className="font-mono text-xs text-[#555550] uppercase tracking-[0.2em] font-bold block">
                  PHASE {currentPhase.id} OF 04 · {currentPhase.name}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0B]">
                  {currentPhase.title}
                </h2>
              </div>

              <div className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-[#0D0D0B] shrink-0">
                {progress}
                <span className="text-xl sm:text-2xl text-[#555550]">%</span>
              </div>
            </div>

            {/* 4 Phase Pipeline Stepper */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              {PHASES.map((phase, idx) => {
                const isActive = idx === currentPhaseIndex;
                const isPassed = progress > phase.maxProgress;

                return (
                  <div
                    key={phase.id}
                    className={`p-3 border transition-colors ${
                      isActive
                        ? "bg-[#FCDD2D] border-[#0D0D0B] text-[#0D0D0B]"
                        : isPassed
                        ? "bg-[#F8F8F6] border-[#E2E2DF] text-[#0D0D0B]"
                        : "bg-[#FFFFFF] border-[#E2E2DF] text-[#888880]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold mb-1">
                      <span>PHASE {phase.id}</span>
                      <span>
                        {isPassed ? "✓ DONE" : isActive ? "ACTIVE" : `${phase.minProgress}%`}
                      </span>
                    </div>
                    <div className="font-bold text-[11px] truncate">
                      {phase.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#F8F8F6] border border-[#0D0D0B] p-[2px] relative">
              <motion.div
                className="h-full bg-[#0D0D0B]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>

            {/* Information Revealing Card */}
            <div className="bg-[#F8F8F6] border border-[#E2E2DF] border-l-4 border-l-[#FCDD2D] p-5 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-[#555550] uppercase font-bold">
                <span>[ REVEALING REASONING KERNEL ]</span>
                <span className="text-[#0D0D0B] bg-[#89FA91] px-1.5 py-0.5 border border-[#0D0D0B]">
                  LIVE STREAM
                </span>
              </div>

              <p className="text-[#0D0D0B] font-bold text-sm">
                &gt; {currentPhase.detail}
              </p>

              <div className="text-[10px] text-[#888880] pt-1">
                Range: {currentPhase.minProgress}% - {currentPhase.maxProgress}% · System boundaries locked.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
