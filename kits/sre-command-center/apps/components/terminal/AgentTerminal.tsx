"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu } from "lucide-react";
import { LogLine } from "../../lib/types";

interface AgentTerminalProps {
  logs: LogLine[];
  isActive: boolean;
}

const typeClass: Record<LogLine["type"], string> = {
  system: "log-info",
  agent: "log-agent",
  router: "log-router",
  success: "log-success",
  warning: "log-warning",
  error: "log-error",
  dim: "log-dim",
};

export default function AgentTerminal({ logs, isActive }: AgentTerminalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Scroll ONLY the internal terminal container, never the window/page
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-140px)] max-h-[640px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-indigo-400" />
          <span className="text-xs font-extrabold tracking-wider uppercase text-white">
            Autonomous SRE Agent Terminal
          </span>
          {isActive && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 ml-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>LIVE TRIAGE PROCESSING</span>
            </motion.span>
          )}
        </div>

        <span className="text-[11px] font-mono text-gray-400">
          Logs: {logs.length}
        </span>
      </div>

      {/* Terminal Window with Fixed Height & Internal Scroll */}
      <div className="terminal flex-1 flex flex-col overflow-hidden shadow-2xl border border-white/10 rounded-2xl bg-[#090d16]">
        <div className="terminal-header flex-shrink-0 bg-gray-950/80 border-b border-white/10 px-4 py-2.5">
          <div className="terminal-dot" style={{ background: "#ef4444" }} />
          <div className="terminal-dot" style={{ background: "#f59e0b" }} />
          <div className="terminal-dot" style={{ background: "#10b981" }} />
          <span className="text-xs ml-2.5 font-mono text-gray-400">
            aria@sre-command-center:~
          </span>
          <Terminal size={13} className="ml-auto text-gray-500" />
        </div>

        {/* Scrollable logs area (fixed height, custom scrollbar) */}
        <div
          ref={bodyRef}
          className="terminal-body flex-1 overflow-y-auto px-4 py-3.5 space-y-1.5 font-mono text-xs custom-scrollbar"
        >
          {/* Welcome lines */}
          {!isActive && logs.length === 0 && (
            <div className="space-y-1 py-4">
              <p className="text-gray-400">
                Welcome to ARIA — Autonomous SRE Command Center v2.4
              </p>
              <p className="text-gray-500">
                Waiting for incident alert simulation...
              </p>
              <p className="text-indigo-400 cursor-blink" />
            </div>
          )}

          <AnimatePresence>
            {logs.map((line) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="leading-relaxed flex items-start gap-2"
              >
                <span className="text-gray-600 select-none">&gt;</span>
                <span
                  className={`${typeClass[line.type]} font-bold flex-shrink-0`}
                >
                  {line.prefix}
                </span>
                <span className="text-gray-200 break-words flex-1">
                  {line.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
