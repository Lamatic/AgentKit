"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openInOverleaf, downloadTexFile } from "@/lib/overleaf";
import ShinyText from "@/components/ShinyText";

// Real PDF preview via a server-side pdflatex compile.
//
//   client → POST /api/compile-latex { latex }
//          ← 200 application/pdf       (success)
//          ← 422 { ok:false, log }     (compile failed; show log)
//          ← 500 { ok:false, error }   (route blew up)
//
// We display the returned PDF in an <iframe> via a blob URL so the
// browser's native PDF viewer handles paging/scroll/zoom — no JS PDF
// renderer needed. Blob URL is revoked when this prop changes or the
// component unmounts.

interface LatexPreviewProps {
  latex: string;
}

type Phase =
  | { kind: "loading"; message: string }
  | { kind: "ready"; url: string }
  | { kind: "error"; message: string; log?: string };

export default function LatexPreview({ latex }: LatexPreviewProps) {
  const [phase, setPhase] = useState<Phase>({
    kind: "loading",
    message: "Compiling your PDF",
  });
  const [showLog, setShowLog] = useState(false);
  const lastUrlRef = useRef<string | null>(null);
  const revokeLastUrl = useCallback(() => {
    if (lastUrlRef.current) {
      URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    revokeLastUrl();
    setPhase({ kind: "loading", message: "Compiling your PDF" });

    (async () => {
      try {
        const res = await fetch("/api/compile-latex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latex }),
        });
        if (cancelled) return;

        const ct = res.headers.get("content-type") || "";
        if (res.ok && ct.includes("application/pdf")) {
          const blob = await res.blob();
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          revokeLastUrl();
          lastUrlRef.current = url;
          setPhase({ kind: "ready", url });
          return;
        }

        // Non-PDF response: try to read the structured error.
        let message = `Compile failed (HTTP ${res.status}).`;
        let log: string | undefined;
        try {
          const body = (await res.json()) as { error?: string; log?: string };
          if (body.error) message = body.error;
          log = body.log;
        } catch {
          // Fall through with generic message.
        }
        revokeLastUrl();
        setPhase({ kind: "error", message, log });
      } catch (err) {
        if (cancelled) return;
        revokeLastUrl();
        setPhase({
          kind: "error",
          message:
            err instanceof Error
              ? `Network error: ${err.message}`
              : "Network error contacting the compile route.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [latex, revokeLastUrl]);

  useEffect(() => {
    return revokeLastUrl;
  }, [revokeLastUrl]);

  if (phase.kind === "loading") {
    return (
      <div className="flex items-center justify-center h-150 rounded-lg border border-white/10 bg-black/20">
        <ShinyText
          text={phase.message}
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
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-sm font-medium text-destructive">
              Couldn&apos;t compile the PDF
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {phase.message}
            </p>
          </div>
        </div>

        {phase.log && (
          <div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => setShowLog((s) => !s)}
            >
              {showLog ? "Hide" : "Show"} pdflatex log
            </button>
            {showLog && (
              <pre className="mt-2 p-3 rounded bg-black/40 border border-white/5 text-[11px] font-mono text-destructive/80 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap">
                {phase.log}
              </pre>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={() => openInOverleaf(latex)}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open in Overleaf
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadTexFile(latex)}>
            <FileDown className="h-3.5 w-3.5 mr-1.5" />
            Download .tex
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <iframe
        title="MoU PDF preview"
        src={phase.url}
        className="w-full h-225 rounded-lg border border-white/10 bg-white"
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
