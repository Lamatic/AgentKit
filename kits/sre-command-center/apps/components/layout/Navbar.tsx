"use client";

import LamaticLogo from "../icons/LamaticLogo";
import { NavbarProps } from "../../lib/types";

/**
 * Renders the responsive top navigation header displaying live system phase, UTC clock, and reset actions.
 * @param props Props containing current phase, time string, and reset callback.
 * @returns React JSX navigation header component.
 */
export default function Navbar({ phase, currentTime, onReset }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-2xl shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={onReset}
          >
            <div className="flex items-center gap-2">
              <LamaticLogo />
            </div>
            <div className="h-5 w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  SRE Command Center
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AgentKit
                </span>
              </div>
              <span className="text-[10px] block text-gray-400 font-mono">
                ARIA Autonomous SRE v2.4
              </span>
            </div>
          </div>
        </div>

        {/* Step Indicator Pills */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold">
          <div
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
              phase === "welcome" || phase === "init"
                ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.35)] scale-105"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                phase === "welcome" || phase === "init"
                  ? "bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]"
                  : "bg-gray-600"
              }`}
            />
            <span>1. Ingest Runbook</span>
          </div>

          <span className="text-gray-600 font-black">→</span>

          <div
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
              phase === "ready" || phase === "generating"
                ? "border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-105"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                phase === "ready" || phase === "generating"
                  ? "bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]"
                  : "bg-gray-600"
              }`}
            />
            <span>2. Simulate Incident</span>
          </div>

          <span className="text-gray-600 font-black">→</span>

          <div
            className={`px-3.5 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
              phase === "processing" || phase === "resolved"
                ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-105"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                phase === "processing" || phase === "resolved"
                  ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"
                  : "bg-gray-600"
              }`}
            />
            <span>3. Auto-Remediate</span>
          </div>
        </div>

        {/* Live Clock & GitHub CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-300 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>{currentTime || "00:00:00 UTC"}</span>
          </div>

          {/* GitHub CTA Button */}
          <a
            href="https://github.com/Lamatic/AgentKit/tree/main/kits/sre-command-center"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all shadow-md hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
