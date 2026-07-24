"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ActiveTimePane } from "./ActiveTimePane";
import { BlockedContentPane } from "./BlockedContentPane";
import { useCommitStore } from "@/hooks/useCommitStore";

interface CommitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPane?: "time" | "block";
  commitId: string; // ** PRODUCTION LEVEL IDENTIFIER: Passed down to load specific commit config **
}

/**
 * A master modal that orchestrates the configuration of a focus block.
 * 
 * It manages the transitions between the 'Active Time' and 'Blocked Content' sub-panes.
 * It also handles global modal state like keyboard navigation (arrow keys) and scroll locking.
 * 
 * @param {CommitSettingsModalProps} props - Configuration options.
 * @param {boolean} props.isOpen - Whether the modal is currently visible.
 * @param {Function} props.onClose - Callback to trigger when the modal should close.
 * @param {"time" | "block"} [props.initialPane] - Which sub-pane to render on first open.
 * @param {string} props.commitId - The ID of the block being edited.
 * @returns {JSX.Element | null} The rendered modal or null if closed.
 */
export function CommitSettingsModal({ isOpen, onClose, initialPane = "time", commitId }: CommitSettingsModalProps) {
  const { commits } = useCommitStore();
  const commit = commits.find(c => c.id === commitId);

  const [activePane, setActivePane] = useState<"time" | "block">(initialPane);
  const [title, setTitle] = useState(commit?.title || "New Block");

  // Reset pane when modal opens
  useEffect(() => {
    if (isOpen) {
      setActivePane(initialPane);
      if (commit) {
        setTitle(commit.title);
      }
    }
  }, [isOpen, initialPane, commit]);

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
      <div className="bg-[#0f0f0f] w-[90%] max-w-[420px] rounded-[24px] flex flex-col shadow-2xl h-[560px] overflow-hidden relative">
        
        {/* Global Header */}
        <div className="flex justify-between items-center p-6 pb-2 shrink-0 z-10 bg-[#0f0f0f] gap-4">
          
          {/* Toggle Pane Arrow */}
          <button 
            onClick={() => setActivePane(activePane === "time" ? "block" : "time")}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-[#151515] text-white/50 hover:text-white transition-all"
            title={activePane === "time" ? "Go to Blocked Content (→)" : "Go to Active Time (←)"}
          >
            <span className="material-symbols-outlined">
              {activePane === "time" ? "chevron_right" : "chevron_left"}
            </span>
          </button>

          {/* ** PRODUCTION LEVEL UI: Title Editor (Unwired as requested) ** */}
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-center text-xl font-bold text-white outline-none border-b border-transparent hover:border-white/10 focus:border-[#e83a3a] transition-colors pb-1 truncate"
            placeholder="Commit Name"
          />

          {/* Close Button */}
          <button onClick={onClose} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-[#151515] text-white/50 hover:text-white transition-colors">
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
                {/* ** PRODUCTION LEVEL PROP INJECTION: Pass commitId down ** */}
                <ActiveTimePane commitId={commitId} onSave={onClose} editedTitle={title} />
              </div>
            </div>

            {/* Block Pane (Right) */}
            <div className="w-1/2 h-full flex flex-col">
              <div className="px-6 pb-2 shrink-0">
                <h2 className="text-2xl font-bold text-white tracking-wide mb-1">Blocked Content</h2>
                <p className="text-[#94a3b8] text-sm">Choose what websites or AI topics to block</p>
              </div>
              <div className="flex-1 overflow-hidden">
                {/* ** PRODUCTION LEVEL PROP INJECTION: Pass commitId down ** */}
                <BlockedContentPane commitId={commitId} onSave={onClose} editedTitle={title} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
