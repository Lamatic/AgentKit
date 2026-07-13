"use client";

import { motion } from "framer-motion";
import {
  Database,
  ShieldAlert,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { WelcomeHeroProps } from "../../lib/types";

export default function WelcomeHero({
  onLaunch,
  isInitializing,
}: WelcomeHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto my-auto text-center relative py-2"
    >
      {/* Floating Ambient Glow Spheres */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-20 left-4 w-72 h-72 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 right-4 w-72 h-72 bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Word-by-Word Staggered Shimmer Hero Title (No Border Shadows) */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-4xl sm:text-6xl font-black tracking-tight mb-5 leading-tight select-none flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1"
      >
        {["Autonomous", "SRE", "Command", "&", "Live", "Runbook", "RAG"].map(
          (word, idx) => (
            <motion.span
              key={word + idx}
              animate={{
                color: [
                  "#ffffff",
                  "#818cf8",
                  "#c084fc",
                  "#34d399",
                  "#ffffff",
                ],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: idx * 0.4,
                ease: "easeInOut",
              }}
              className="inline-block font-black"
            >
              {word}
            </motion.span>
          )
        )}
      </motion.h1>

      <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed font-semibold">
        Experience an end-to-end autonomous SRE Command Center: index operations
        runbooks into Lamatic Vector DB, simulate production outages, and watch
        multi-agent triage dispatch remediations to Slack &amp; Gmail.
      </p>

      {/* 3-Flow Glassmorphic Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-8 text-left">
        {/* Flow 1 Card */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          className="glass p-5 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-indigo-400/70 transition-all duration-300 shadow-lg backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] to-transparent"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-indigo-500/25 text-indigo-200 border border-indigo-400/40">
              FLOW 01
            </span>
          </div>
          <h3 className="font-extrabold text-white text-base mb-1.5 group-hover:text-indigo-300 transition-colors">
            Data Ingestion &amp; Vector DB
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4 font-normal">
            Chunks and embeds internal engineering runbooks into Lamatic Vector
            DB for semantic retrieval.
          </p>
          <div className="flex items-center gap-2 text-xs text-indigo-300 font-bold bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vector DB Sync Ready</span>
          </div>
        </motion.div>

        {/* Flow 2 Card */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          className="glass p-5 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-amber-400/70 transition-all duration-300 shadow-lg backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] to-transparent"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/40">
              FLOW 02
            </span>
          </div>
          <h3 className="font-extrabold text-white text-base mb-1.5 group-hover:text-amber-300 transition-colors">
            Incident Alert Simulator
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4 font-normal">
            Transforms natural language prompts into structured Datadog &amp;
            PagerDuty JSON telemetry alerts.
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>GraphQL Chaos Generator</span>
          </div>
        </motion.div>

        {/* Flow 3 Card */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          className="glass p-5 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-emerald-400/70 transition-all duration-300 shadow-lg backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] to-transparent"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/40">
              FLOW 03
            </span>
          </div>
          <h3 className="font-extrabold text-white text-base mb-1.5 group-hover:text-emerald-300 transition-colors">
            Master Responder &amp; Triage
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4 font-normal">
            Autonomous multi-agent triage: retrieves runbooks and dispatches
            remediations to Slack &amp; Gmail.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Slack &amp; Gmail Automation</span>
          </div>
        </motion.div>
      </div>

      {/* Launch Action Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onLaunch}
        disabled={isInitializing}
        className="btn-primary text-base px-10 py-4 inline-flex items-center gap-3 shadow-[0_0_35px_rgba(99,102,241,0.45)] rounded-2xl font-black tracking-wide transition-all border border-indigo-400/50 relative group overflow-hidden"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-30 transition-opacity" />
        <span>Initialize System &amp; Load Runbooks</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  );
}
