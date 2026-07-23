"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Preloader } from "./Preloader";

interface PreloaderWrapperProps {
  children: React.ReactNode;
}

export function PreloaderWrapper({ children }: PreloaderWrapperProps) {
  const pathname = usePathname();
  const [showPreloader, setShowPreloader] = useState<boolean>(true);
  const [preloaderType, setPreloaderType] = useState<"site" | "terminal">("site");
  const [prevPath, setPrevPath] = useState<string>(pathname);

  // Trigger preloader if user returns to home "/" from an auth page
  useEffect(() => {
    if (pathname === "/" && (prevPath === "/sign-up" || prevPath === "/sign-in")) {
      setPreloaderType("terminal");
      setShowPreloader(true);
    }
    setPrevPath(pathname);
  }, [pathname, prevPath]);

  const handleFinish = () => {
    setShowPreloader(false);
  };

  return (
    <>
      {showPreloader && (
        preloaderType === "site" ? (
          <Preloader onFinish={handleFinish} />
        ) : (
          <TerminalPreloader onFinish={handleFinish} />
        )
      )}
      {children}
    </>
  );
}

function TerminalPreloader({ onFinish }: { onFinish: () => void }) {
  const [loadingLines, setLoadingLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    const line1 = setTimeout(() => {
      setLoadingLines((prev) => [...prev, "> Ingesting system topology blueprints..."]);
    }, 300);

    const line2 = setTimeout(() => {
      setLoadingLines((prev) => [...prev, "> Evaluating scale tier load boundaries..."]);
    }, 900);

    const line3 = setTimeout(() => {
      setLoadingLines((prev) => [...prev, "> Establishing secure analysis tunnel..."]);
    }, 1500);

    const finishLoader = setTimeout(() => {
      setIsComplete(true);
    }, 2300);

    return () => {
      clearTimeout(line1);
      clearTimeout(line2);
      clearTimeout(line3);
      clearTimeout(finishLoader);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {!isComplete && (
        <motion.div
          key="terminal-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999999] bg-[#FFFFFF] w-screen h-screen flex flex-col items-center justify-start p-6 sm:p-12 text-[#0D0D0B] select-none overflow-hidden"
        >
          {/* Centered Brand Header */}
          <div className="flex items-center justify-center border-b border-[#E2E2DF] pb-4 w-full shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FCDD2D] border border-[#0D0D0B] flex items-center justify-center font-mono font-bold text-xs text-[#0D0D0B]">
                SP
              </div>
              <span className="font-display font-bold text-lg text-[#0D0D0B] tracking-tight">
                ScalePilot
              </span>
            </div>
          </div>

          {/* Centered terminal content */}
          <div className="flex-1 flex flex-col justify-center w-full max-w-lg mx-auto py-8 shrink-0">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0D0D0B]">
                  Analyzing Target Stack...
                </h3>
                <p className="font-mono text-xs text-[#555550] uppercase tracking-wider">
                  Analyzing architecture parameters for ingestion.
                </p>
              </div>

              {/* Console Scanning Lines */}
              <div className="bg-[#F8F8F6] border border-[#E2E2DF] p-5 h-28 font-mono text-xs text-[#555550] space-y-2 flex flex-col justify-start">
                {loadingLines.map((line, idx) => (
                  <div key={idx} className="animate-fade-in font-bold text-[#0D0D0B]">
                    {line}
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-2.5 bg-[#F8F8F6] border border-[#0D0D0B] p-[1.5px]">
                  <motion.div
                    className="h-full bg-[#0D0D0B]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-[#555550]">
                  <span>INITIALIZING SCANNER</span>
                  <span>COMPILING RUNTIMES</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PreloaderWrapper;
