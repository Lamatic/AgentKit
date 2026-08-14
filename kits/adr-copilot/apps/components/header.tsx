"use client";

import React from "react";
import { ShieldCheck, Cpu, FileCode2, Sparkles, Layers } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">ADR Copilot</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                MADR 3.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Lamatic AgentKit • Architecture Decision Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Lamatic/AgentKit/tree/main/kits/adr-copilot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileCode2 className="h-4 w-4 text-cyan-400" />
            <span>Kit Source</span>
          </a>
          <a
            href="https://lamatic.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-3.5 py-1.5 rounded-lg shadow-md shadow-cyan-500/20 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Lamatic.ai Studio</span>
          </a>
        </div>
      </div>
    </header>
  );
}
