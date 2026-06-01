"use client";

import { useEffect, useRef, useState } from "react";
import { compileLatex, pdfBlobUrl } from "@/lib/swiftlatex";
import { AlertTriangle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShinyText from "@/components/ShinyText";

interface LatexPreviewProps {
  latex: string;
}

type Phase =
  | { kind: "idle" }
  | { kind: "loading"; message: string }
  | { kind: "ready"; url: string }
  | { kind: "error"; friendly: string; details?: string; log?: string };

export default function LatexPreview({ latex }: LatexPreviewProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [showLog, setShowLog] = useState(false);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: "loading", message: "Warming up the renderer" });

    (async () => {
      try {
        if (cancelled) return;
        setPhase({ kind: "loading", message: "Rendering your PDF" });
        const res = await compileLatex(latex);
        if (cancelled) return;
        const url = pdfBlobUrl(res.pdf);
        if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = url;
        setPhase({ kind: "ready", url });
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { log?: string };
        setPhase({
          kind: "error",
          friendly:
            "We couldn't render the PDF in your browser. You can still download the .tex file or open it in Overleaf.",
          details: e.message,
          log: e.log,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [latex]);

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    };
  }, []);

  if (phase.kind === "loading" || phase.kind === "idle") {
    const message = phase.kind === "loading" ? phase.message : "Getting ready";
    return (
      <div className="flex items-center justify-center h-[600px] rounded-lg border border-white/10 bg-black/20">
        <ShinyText
          key={message}
          text={message}
          speed={2.4}
          color="#7a7a85"
          shineColor="#ffffff"
          spread={70}
          direction="left"
          className="text-sm font-medium tracking-tight"
        />
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">
              Preview not available
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {phase.friendly}
            </p>
          </div>
        </div>
        {(phase.details || phase.log) && (
          <div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => setShowLog((s) => !s)}
            >
              {showLog ? "Hide" : "Show"} technical details
            </button>
            {showLog && (
              <pre className="mt-2 p-3 rounded bg-black/40 border border-white/5 text-[11px] font-mono text-destructive/80 overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                {phase.details}
                {phase.log ? "\n\n" + phase.log : ""}
              </pre>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <iframe
        title="MoU PDF preview"
        src={phase.url}
        className="w-full h-[800px] rounded-lg border border-white/10 bg-white"
      />
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <a href={phase.url} download="mou-draft.pdf">
            <FileDown className="h-3.5 w-3.5 mr-1.5" />
            Download PDF
          </a>
        </Button>
      </div>
    </div>
  );
}
