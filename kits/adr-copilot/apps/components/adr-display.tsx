"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Download, Check, FileText, Layers, GitFork, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { ADRResult } from "../actions/orchestrate";
import { MermaidViewer } from "./mermaid-viewer";

interface ADRDisplayProps {
  data: ADRResult;
  isFallback?: boolean;
  errorNotice?: string;
}

export function ADRDisplay({ data, isFallback, errorNotice }: ADRDisplayProps) {
  const [activeTab, setActiveTab] = useState<"markdown" | "structured" | "diagram">("markdown");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const handleDownload = () => {
    const filename = `ADR-${data.adrNumber || "0001"}-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    const blob = new Blob([data.markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const defaultDiagram = `graph TD
  Client[Client / Web Browser] --> Gateway[API Gateway / Ingress]
  Gateway --> Service[Core Service / Worker]
  Service --> PrimaryDB[(Primary Database)]
  Service --> Cache[(Cache / Storage)]`;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col h-full">
      {/* Top Header Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg">
            ADR-{data.adrNumber || "0001"}
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {data.status || "Accepted"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copied ? "Copied!" : "Copy Markdown"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 px-3 py-1.5 rounded-lg transition-all"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export .md</span>
          </button>
        </div>
      </div>

      {isFallback && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 text-xs flex items-center gap-2" style={{ color: "hsl(var(--color-danger-fg))" }}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>This ADR was generated from a fallback parse — some structured fields may be incomplete. Review the MADR Document tab for the full output.</span>
        </div>
      )}

      {errorNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-slate-950/40 border-b border-slate-800/80 px-5 pt-3 flex gap-2">
        <button
          onClick={() => setActiveTab("markdown")}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "markdown"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>MADR 3.0 Document</span>
        </button>
        <button
          onClick={() => setActiveTab("structured")}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "structured"
              ? "border-purple-400 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Option Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab("diagram")}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "diagram"
              ? "border-indigo-400 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitFork className="h-4 w-4" />
          <span>Architecture Diagram</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 overflow-y-auto max-h-[650px] font-sans">
        {activeTab === "markdown" && (
          <div className="prose prose-invert prose-cyan max-w-none space-y-4">
            <ReactMarkdown>{data.markdownContent}</ReactMarkdown>
          </div>
        )}

        {activeTab === "structured" && (
          <div className="space-y-6">
            {/* Title & Context */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <h3 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>{data.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--color-body))" }}>{typeof data.context === 'object' ? JSON.stringify(data.context) : data.context}</p>
            </div>

            {/* Decision Drivers */}
            {Array.isArray(data.decisionDrivers) && data.decisionDrivers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Decision Drivers & Forces</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.decisionDrivers.map((driver, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs text-slate-200 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>{typeof driver === 'object' ? JSON.stringify(driver) : driver}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Considered Options */}
            {Array.isArray(data.consideredOptions) && data.consideredOptions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--color-subtle))" }}>Considered Alternatives</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.consideredOptions.map((opt, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="font-semibold text-sm border-b border-slate-800 pb-2" style={{ color: "hsl(var(--color-accent-fg))" }}>
                        {typeof opt.name === 'object' ? JSON.stringify(opt.name) : opt.name}
                      </div>
                      <p className="text-xs" style={{ color: "hsl(var(--color-subtle))" }}>{typeof opt.description === 'object' ? JSON.stringify(opt.description) : opt.description}</p>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--color-success-fg))" }}>Pros</div>
                        {Array.isArray(opt.pros) && opt.pros.map((p, i) => (
                          <div key={i} className="text-xs flex items-start gap-1.5" style={{ color: "hsl(var(--color-body))" }}>
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--color-success-fg))" }} />
                            <span>{typeof p === 'object' ? JSON.stringify(p) : p}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--color-danger-fg))" }}>Cons</div>
                        {Array.isArray(opt.cons) && opt.cons.map((c, i) => (
                          <div key={i} className="text-xs flex items-start gap-1.5" style={{ color: "hsl(var(--color-body))" }}>
                            <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--color-danger-fg))" }} />
                            <span>{typeof c === 'object' ? JSON.stringify(c) : c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chosen Outcome & Consequences */}
            {data.chosenOption && (
              <div className="p-4 bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-500/30 rounded-xl space-y-2">
                <div className="text-xs font-bold uppercase" style={{ color: "hsl(var(--color-accent-fg))" }}>Decision Outcome</div>
                <div className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{typeof data.chosenOption === 'object' ? JSON.stringify(data.chosenOption) : data.chosenOption}</div>
              </div>
            )}
            {/* Consequences */}
            {data.consequences && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--color-subtle))" }}>Consequences</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.isArray(data.consequences.positive) && data.consequences.positive.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--color-success-fg))" }}>Positive</div>
                      {data.consequences.positive.map((item, i) => (
                        <div key={i} className="text-xs flex items-start gap-1.5" style={{ color: "hsl(var(--color-body))" }}>
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--color-success-fg))" }} />
                          <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(data.consequences.negative) && data.consequences.negative.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--color-danger-fg))" }}>Negative</div>
                      {data.consequences.negative.map((item, i) => (
                        <div key={i} className="text-xs flex items-start gap-1.5" style={{ color: "hsl(var(--color-body))" }}>
                          <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--color-danger-fg))" }} />
                          <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "diagram" && (
          <MermaidViewer chart={data.mermaidDiagram || defaultDiagram} />
        )}
      </div>
    </div>
  );
}
