"use client";

import { useState, useMemo } from "react";

interface WorkspaceLogViewerProps {
  rawLog?: string;
  evidenceLines?: string[];
}

export function WorkspaceLogViewer({ rawLog, evidenceLines = [] }: WorkspaceLogViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => {
    if (!rawLog) return ["No raw log available."];
    return rawLog.split("\n");
  }, [rawLog]);

  const filteredLines = useMemo(() => {
    if (!searchQuery.trim()) {
      return lines.map((line, index) => ({ line, originalIndex: index + 1 }));
    }
    const q = searchQuery.toLowerCase();
    return lines
      .map((line, index) => ({ line, originalIndex: index + 1 }))
      .filter((item) => item.line.toLowerCase().includes(q));
  }, [lines, searchQuery]);

  const handleCopyLogs = () => {
    if (rawLog) {
      navigator.clipboard.writeText(rawLog);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isErrorLine = (lineText: string) => {
    const lower = lineText.toLowerCase();
    return (
      lower.includes("error") ||
      lower.includes("fatal") ||
      lower.includes("killed") ||
      lower.includes("exit code") ||
      lower.includes("failed") ||
      evidenceLines.some((e) => lineText.includes(e))
    );
  };

  return (
    <div className="glass-panel rounded-[24px] overflow-hidden transition-all duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs font-semibold text-white hover:text-cyan-300 transition-all"
          >
            <span>{isOpen ? "▼" : "▶"}</span>
            <span>Raw Log Explorer ({lines.length} Lines)</span>
          </button>
          {evidenceLines.length > 0 && (
            <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-medium text-rose-300">
              {evidenceLines.length} Evidence Hits
            </span>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search log lines..."
                className="w-48 sm:w-64 rounded-[12px] border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-[var(--muted)] focus:border-cyan-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1.5 text-xs text-[var(--muted)] hover:text-white"
                >
                  ×
                </button>
              )}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyLogs}
              className="rounded-[12px] border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-all"
            >
              {copied ? "✓ Copied Logs" : "Copy Logs"}
            </button>
          </div>
        )}
      </div>

      {/* Terminal View Body */}
      {isOpen && (
        <div className="max-h-80 overflow-y-auto bg-black/80 p-4 font-mono text-xs text-white/80 space-y-1 selection:bg-cyan-500 selection:text-black">
          {filteredLines.length === 0 ? (
            <p className="text-center text-[var(--muted)] py-4">No lines matching "{searchQuery}"</p>
          ) : (
            filteredLines.map((item) => {
              const isError = isErrorLine(item.line);
              return (
                <div
                  key={item.originalIndex}
                  className={`flex gap-3 hover:bg-white/5 px-2 py-0.5 rounded transition-all ${
                    isError ? "bg-rose-950/40 text-rose-300 font-semibold border-l-2 border-rose-500" : ""
                  }`}
                >
                  <span className="w-10 text-right text-[var(--muted)] select-none flex-shrink-0">
                    {item.originalIndex}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{item.line}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
