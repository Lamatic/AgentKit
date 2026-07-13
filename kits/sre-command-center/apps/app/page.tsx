"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Terminal as TerminalIcon } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import WelcomeHero from "../components/panels/WelcomeHero";
import InitializationPanel from "../components/panels/InitializationPanel";
import AttackPanel from "../components/panels/AttackPanel";
import AgentTerminal from "../components/terminal/AgentTerminal";
import ResolutionCard from "../components/panels/ResolutionCard";
import { useIncidentFlow } from "../hooks/useIncidentFlow";

export default function Home() {
  const {
    phase,
    setPhase,
    terminalLogs,
    isTerminalActive,
    resolvedData,
    currentAlert,
    handleAlertGenerated,
    handleReset,
  } = useIncidentFlow();

  const [currentTime, setCurrentTime] = useState("");
  const [activeView, setActiveView] = useState<"simulator" | "report">(
    "simulator"
  );

  // Auto switch to dedicated report screen when resolved
  useEffect(() => {
    if (phase === "resolved" && resolvedData) {
      setActiveView("report");
    }
  }, [phase, resolvedData]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toTimeString().split(" ")[0] + " " + (now.getTimezoneOffset() === 0 ? "UTC" : "")
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const showRightPanel =
    phase === "processing" || phase === "resolved" || terminalLogs.length > 0;

  const isFullReportView =
    phase === "resolved" &&
    activeView === "report" &&
    Boolean(resolvedData) &&
    Boolean(currentAlert);

  return (
    <div
      className={`w-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] pt-16 ${
        isFullReportView
          ? "min-h-screen overflow-y-auto"
          : "h-screen overflow-hidden"
      }`}
    >
      <Navbar phase={phase} currentTime={currentTime} onReset={handleReset} />

      {/* Flow 1: Initialization Panel */}
      <AnimatePresence>
        {phase === "init" && (
          <InitializationPanel
            onComplete={() => setPhase("ready")}
            onClose={() => setPhase("welcome")}
          />
        )}
      </AnimatePresence>

      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-6 ${
          isFullReportView
            ? "py-8"
            : "py-3 flex flex-col justify-center overflow-hidden"
        }`}
      >
        {/* Welcome state */}
        {phase === "welcome" && (
          <WelcomeHero
            onLaunch={() => setPhase("init")}
            isInitializing={false}
          />
        )}

        {/* Operational Workspace */}
        {phase !== "welcome" && phase !== "init" && (
          <AnimatePresence mode="wait">
            {/* Dedicated Full-Screen Report View (Only after complete resolution) */}
            {isFullReportView ? (
              <motion.div
                key="screen-report"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pb-12"
              >
                {/* Top View Toggle & Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gray-900/60 border border-white/10 backdrop-blur-xl shadow-lg flex-shrink-0">
                  <button
                    onClick={() => setActiveView("simulator")}
                    className="btn-ghost text-xs px-4 py-2 flex items-center gap-2 border border-white/15 hover:border-indigo-400/50 text-gray-200 transition-all rounded-xl font-bold"
                  >
                    <ArrowLeft size={14} className="text-indigo-400" />
                    <span>View Simulator &amp; Terminal Logs</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ● RESOLUTION COMPLETE
                    </span>
                    <span className="text-gray-400 hidden sm:inline">
                      Dedicated Autonomous Runbook Screen
                    </span>
                  </div>
                </div>

                {/* Dedicated Resolution Card Container */}
                <div className="glass rounded-3xl p-5 border border-white/10 shadow-2xl flex-1 overflow-hidden flex flex-col">
                  <ResolutionCard
                    report={resolvedData?.report || ""  }
                    alertId={currentAlert?.alert_id || ""}
                    severity={currentAlert?.severity || ""}
                    service={currentAlert?.service || ""}
                    environment={currentAlert?.environment || ""}
                    triageCategory={resolvedData?.triage_category || ""}
                    retrievalSource={resolvedData?.retrieval_source || ""}
                    timestamp={currentAlert?.timestamp || ""}
                    onReset={handleReset}
                  />
                </div>
              </motion.div>
            ) : (
              /* Dual-Panel Simulator & Terminal View (Equal fixed height h-[520px]) */
              <motion.div
                key="screen-simulator"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* If resolved but viewing simulator, show banner to switch to full report */}
                {phase === "resolved" && (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-bold shadow-md">
                    <span>
                      ✓ Incident successfully triaged and remediated.
                    </span>
                    <button
                      onClick={() => setActiveView("report")}
                      className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 shadow-md"
                    >
                      <FileText size={13} />
                      <span>View Dedicated Report Screen →</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left Column — Attack Simulator (Fixed matching height) */}
                  <div
                    className={`transition-all duration-300 ${
                      showRightPanel
                        ? "lg:col-span-5"
                        : "lg:col-span-12 max-w-2xl mx-auto w-full"
                    }`}
                  >
                    <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl h-full">
                      <AttackPanel
                        onAlertGenerated={handleAlertGenerated}
                        isProcessing={phase === "processing"}
                      />
                    </div>
                  </div>

                  {/* Right Column — Agent Terminal (Fixed matching height) */}
                  {showRightPanel && (
                    <div className="lg:col-span-7">
                      <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl h-full">
                        <AgentTerminal
                          logs={terminalLogs}
                          isActive={isTerminalActive}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
