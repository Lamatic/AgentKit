"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ActiveTimePane } from "./ActiveTimePane";
import { BlockedContentPane } from "./BlockedContentPane";

interface CommitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPane?: "time" | "block";
}

export function CommitSettingsModal({ isOpen, onClose, initialPane = "time" }: CommitSettingsModalProps) {
  const [activePane, setActivePane] = useState<"time" | "block">(initialPane);

  // Reset pane when modal opens
  useEffect(() => {
    if (isOpen) {
      setActivePane(initialPane);
    }
  }, [isOpen, initialPane]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight" && activePane === "time") {
        setActivePane("block");
      } else if (e.key === "ArrowLeft" && activePane === "block") {
        setActivePane("time");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activePane]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      
      {/* Modal Container */}
      <div className="bg-[#0f0f0f] w-[90%] max-w-[420px] rounded-[24px] border border-white/10 flex flex-col shadow-2xl h-[560px] overflow-hidden relative">
        
        {/* Global Header */}
        <div className="flex justify-between items-center p-6 pb-2 shrink-0 z-10 bg-[#0f0f0f]">
          
          {/* Toggle Pane Arrow */}
          <button 
            onClick={() => setActivePane(activePane === "time" ? "block" : "time")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#151515] text-white/50 hover:text-white transition-all"
            title={activePane === "time" ? "Go to Blocked Content (→)" : "Go to Active Time (←)"}
          >
            <span className="material-symbols-outlined">
              {activePane === "time" ? "chevron_right" : "chevron_left"}
            </span>
          </button>

          {/* Close Button */}
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#151515] text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Sliding Viewport */}
        <div className="flex-1 relative w-full overflow-hidden">
          
          {/* Slider Track */}
          <div 
            className="flex w-[200%] h-full transition-transform duration-300 ease-in-out"
            style={{ transform: activePane === "time" ? "translateX(0%)" : "translateX(-50%)" }}
          >
            
            {/* Time Pane (Left) */}
            <div className="w-1/2 h-full flex flex-col">
              <div className="px-6 pb-2 shrink-0">
                <h2 className="text-2xl font-bold text-white tracking-wide mb-1">Active Time</h2>
                <p className="text-[#94a3b8] text-sm">Choose when this commitment is active</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ActiveTimePane onSave={onClose} />
              </div>
            </div>

            {/* Block Pane (Right) */}
            <div className="w-1/2 h-full flex flex-col">
              <div className="px-6 pb-2 shrink-0">
                <h2 className="text-2xl font-bold text-white tracking-wide mb-1">Blocked Content</h2>
                <p className="text-[#94a3b8] text-sm">Choose what websites or AI topics to block</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <BlockedContentPane onSave={onClose} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
