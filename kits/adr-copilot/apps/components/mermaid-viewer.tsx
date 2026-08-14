"use client";

import React, { useEffect, useState } from "react";
import { Code, Eye } from "lucide-react";

interface MermaidViewerProps {
  chart: string;
}

export function MermaidViewer({ chart }: MermaidViewerProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "code">("visual");

  const cleanedCode = (chart || "")
    .trim()
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/\s*```$/, "");

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!cleanedCode) return;
      try {
        setError(null);
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        });

        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, cleanedCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.error("Mermaid rendering error:", err);
        if (isMounted) {
          setError(err?.message || "Failed to render Mermaid diagram.");
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [cleanedCode]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-400">Architecture Diagram</div>
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === "visual"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="h-3 w-3" />
            Visual
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === "code"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code className="h-3 w-3" />
            Source
          </button>
        </div>
      </div>

      {viewMode === "visual" ? (
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 flex items-center justify-center overflow-x-auto min-h-[220px]">
          {error ? (
            <div className="text-xs text-amber-400 bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 max-w-full font-mono">
              <div className="font-semibold mb-1">Mermaid Source Syntax</div>
              <pre className="text-[11px] text-slate-300 overflow-x-auto">{cleanedCode}</pre>
            </div>
          ) : svgContent ? (
            <div
              className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="text-xs text-slate-500 animate-pulse">Rendering interactive diagram...</div>
          )}
        </div>
      ) : (
        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-cyan-300 overflow-x-auto">
          {cleanedCode}
        </pre>
      )}
    </div>
  );
}
