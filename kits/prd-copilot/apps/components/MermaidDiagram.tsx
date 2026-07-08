"use client"

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  code: string;
}

export default function MermaidDiagram({ code }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mermaid only once on client side
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "strict",
      fontFamily: "Geist Mono, Courier New, monospace",
      themeVariables: {
        background: "#0f172a",
        primaryColor: "#3b82f6",
        primaryTextColor: "#f8fafc",
        lineColor: "#64748b",
        secondaryColor: "#1e293b",
      }
    });
  }, []);

  useEffect(() => {
    if (!code) return;

    setError(null);
    setSvg("");

    const renderChart = async () => {
      try {
        const uniqueId = `mermaid-${Math.floor(Math.random() * 1000000)}`;
        
        // Validate and clean up code
        let cleanCode = code.trim();
        // Remove trailing/leading backticks if LLM returned them
        if (cleanCode.startsWith("```")) {
          cleanCode = cleanCode.replace(/^```(mermaid)?/, "").replace(/```$/, "").trim();
        }

        // Clean up common LLM Mermaid syntax quirks (e.g. `-->|label|>` should be `-->|label|`)
        cleanCode = cleanCode.replace(/-->\|([^|]+)\|>/g, "-->|$1|");

        // Render diagram using mermaid API
        const { svg: renderedSvg } = await mermaid.render(uniqueId, cleanCode);
        setSvg(renderedSvg);
      } catch (err) {
        console.error("Mermaid parsing error:", err);
        setError("Failed to render diagram. Please check the syntax or try refining your request.");
      }
    };

    renderChart();
  }, [code]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
        <p className="font-semibold mb-1">Diagram Render Error</p>
        <p className="opacity-90">{error}</p>
        <details className="mt-2 text-xs opacity-75 cursor-pointer">
          <summary>View raw Mermaid code</summary>
          <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-2 font-mono text-slate-300">
            {code}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40 p-6 flex justify-center">
      {svg ? (
        <div 
          ref={containerRef} 
          className="w-full flex justify-center max-w-full [&>svg]:h-auto [&>svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }} 
        />
      ) : (
        <div className="flex h-32 items-center justify-center text-slate-500 animate-pulse text-sm">
          Rendering flowchart...
        </div>
      )}
    </div>
  );
}
