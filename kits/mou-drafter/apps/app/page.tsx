"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MoUForm from "@/components/MoUForm";
import LatexPreview from "@/components/LatexPreview";
import ShinyText from "@/components/ShinyText";
import { generateMoU } from "@/actions/orchestrate";
import { downloadTexFile, buildOverleafUrl } from "@/lib/overleaf";
import type { MoUFormData, MoUFlowResult } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileDown,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

const TIMEOUT_SECONDS = 180; // matches actions/orchestrate.ts

// Rotating loading messages — index advances every ~12s.
const LOADING_MESSAGES = [
  "Drafting your MoU",
  "Setting up the parties and recitals",
  "Working through each clause",
  "Aligning numbers across the document",
  "Checking jurisdiction-specific rules",
  "Tightening the language",
  "Cross-checking everything",
  "Putting on the finishing touches",
];

type Phase =
  | { kind: "form" }
  | { kind: "generating"; startedAt: number }
  | { kind: "result"; data: MoUFlowResult }
  | { kind: "error"; message: string };

export default function Page() {
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [formData, setFormData] = useState<MoUFormData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showLatexSource, setShowLatexSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drive the 1s ticker only while generating.
  useEffect(() => {
    if (phase.kind !== "generating") {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
      setElapsed(0);
      return;
    }
    const started = phase.startedAt;
    setElapsed(0);
    tickerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
    };
  }, [phase]);

  async function runGenerate(data: MoUFormData) {
    setFormData(data);
    setPhase({ kind: "generating", startedAt: Date.now() });
    try {
      const response = await generateMoU(data);
      if (response.success && response.data) {
        setPhase({ kind: "result", data: response.data });
      } else {
        setPhase({
          kind: "error",
          message: response.error || "Unknown error generating MoU.",
        });
      }
    } catch (err) {
      setPhase({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Unexpected error occurred.",
      });
    }
  }

  function handleRetry() {
    if (!formData) return;
    void runGenerate(formData);
  }

  function handleBackToForm() {
    setPhase({ kind: "form" });
  }

  function handleCopyError(message: string) {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const progressPct = Math.min(100, (elapsed / TIMEOUT_SECONDS) * 100);
  const loadingMessage = useMemo(() => {
    const idx = Math.min(
      LOADING_MESSAGES.length - 1,
      Math.floor(elapsed / 12)
    );
    return LOADING_MESSAGES[idx];
  }, [elapsed]);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            MoU Drafter
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-xl">
            Generate a professional Memorandum of Understanding from your agreement details. Review, edit, and export the draft before sharing.
          </p>
        </div>

        {/* ── Phase: form ─────────────────────────────────────── */}
        {phase.kind === "form" && (
          <MoUForm
            onSubmit={runGenerate}
            isSubmitting={false}
            initialValues={formData ?? undefined}
          />
        )}

        {/* ── Phase: generating ──────────────────────────────── */}
        {phase.kind === "generating" && (
          <Card className="glass-card">
            <CardContent className="py-10 space-y-6">
              <div className="text-center">
                <ShinyText
                  key={loadingMessage}
                  text={loadingMessage}
                  speed={2.4}
                  delay={0.2}
                  color="#7a7a85"
                  shineColor="#ffffff"
                  spread={70}
                  direction="left"
                  className="text-lg font-medium tracking-tight"
                />
              </div>

              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-white/70 transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed text-center">
                Usually 30–90 seconds. Hang tight — you can leave this tab open.
              </p>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Phase: error ───────────────────────────────────── */}
        {phase.kind === "error" && (
          <div className="space-y-5">
            <div className="p-5 border border-destructive/30 rounded-xl bg-destructive/5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-destructive">
                    Couldn&apos;t finish the draft
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Something timed out or the service hiccuped. Your inputs
                    are still here — try again, or go back to tweak the form.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                    Error details
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyError(phase.message)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 border border-white/5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
                <pre className="text-[11px] font-mono text-destructive/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto">
                  {phase.message}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleRetry} disabled={!formData}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Try again
                </Button>
                <Button variant="outline" onClick={handleBackToForm}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Edit details
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Phase: result ──────────────────────────────────── */}
        {phase.kind === "result" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleBackToForm}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Edit details
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>

            {/* Things worth a second look */}
            {phase.data.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  Worth a second look ({phase.data.warnings.length})
                </AlertTitle>
                <AlertDescription>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    These are just heads-ups based on the choices you made —
                    nothing is wrong with the draft.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {phase.data.warnings.map((w, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">
                          {i + 1}.
                        </span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Pattern report */}
            {(phase.data.patternReport.missing.length > 0 ||
              phase.data.patternReport.unexpected.length > 0) && (
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Clause coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {phase.data.patternReport.missing.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs text-destructive font-medium">
                          Skipped (consider regenerating):
                        </span>
                        {phase.data.patternReport.missing.map((p) => (
                          <Badge
                            key={p}
                            variant="destructive"
                            className="text-xs"
                          >
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {phase.data.patternReport.unexpected.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs text-muted-foreground font-medium">
                          Extra clauses added:
                        </span>
                        {phase.data.patternReport.unexpected.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {phase.data.patternReport.missing.length === 0 &&
                      phase.data.patternReport.unexpected.length === 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Every clause you asked for is in the draft
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

            {/* In-browser PDF preview */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Your draft
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LatexPreview latex={phase.data.latex} />
              </CardContent>
            </Card>

            {/* Download actions */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Download &amp; share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="default"
                    onClick={() => downloadTexFile(phase.data.latex)}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download .tex
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = buildOverleafUrl(phase.data.latex);
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Overleaf
                  </Button>
                </div>

                <Separator />

                {/* LaTeX source (collapsible) */}
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowLatexSource(!showLatexSource)}
                  >
                    {showLatexSource ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    Show the raw .tex source
                  </button>
                  {showLatexSource && (
                    <pre
                      className="mt-3 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px] overflow-y-auto"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {phase.data.latex}
                    </pre>
                  )}
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground italic border-t pt-3">
                  Treat this as a first draft, not legal advice. Have a lawyer
                  in your jurisdiction look it over before anyone signs.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
