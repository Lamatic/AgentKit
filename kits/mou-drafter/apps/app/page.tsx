"use client";

import { useState } from "react";
import MoUForm from "@/components/MoUForm";
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
} from "lucide-react";

export default function Page() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<MoUFlowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [showLatexSource, setShowLatexSource] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyError() {
    if (!error) return;
    navigator.clipboard.writeText(error);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(data: MoUFormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await generateMoU(data);
      if (response.success && response.data) {
        setResult(response.data);
        setShowForm(false);
      } else {
        setError(response.error || "Unknown error generating MoU.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackToForm() {
    setShowForm(true);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="mb-10">
          <span className="inline-block text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground border border-white/10 rounded-full px-3 py-1 mb-4">
            Lamatic Agent Kit
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">MoU Drafter</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-xl">
            Draft a vendor Memorandum of Understanding from structured input.
            AI-generated first draft for human review — not legal advice.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-5 border border-destructive/30 rounded-xl bg-destructive/5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-destructive">
                  Generation Failed
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Lamatic flow or LLM took too long to respond. The system may be overloaded. Please wait a minute and try clicking the <strong>Generate MoU Draft</strong> button again.
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Error Details</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyError}
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
                      <span>Copy Details</span>
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-[11px] font-mono text-destructive/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto">
                {error}
              </pre>
            </div>
          </div>
        )}

        {/* ── Form ────────────────────────────────────────────── */}
        {showForm && (
          <MoUForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}

        {/* ── Result ──────────────────────────────────────────── */}
        {!showForm && result && (
          <div className="space-y-6">
            {/* Back button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToForm}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Edit form
            </Button>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  Drafting notes for human review ({result.warnings.length})
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {result.warnings.map((w, i) => (
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
            {(result.patternReport.missing.length > 0 ||
              result.patternReport.unexpected.length > 0) && (
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Pattern Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.patternReport.missing.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs text-destructive font-medium">
                        Missing:
                      </span>
                      {result.patternReport.missing.map((p) => (
                        <Badge key={p} variant="destructive" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {result.patternReport.unexpected.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs text-muted-foreground font-medium">
                        Unexpected:
                      </span>
                      {result.patternReport.unexpected.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {result.patternReport.missing.length === 0 &&
                    result.patternReport.unexpected.length === 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5" />
                        All expected patterns present
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Download actions */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Your Draft
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="default"
                    onClick={() => downloadTexFile(result.latex)}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download .tex
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = buildOverleafUrl(result.latex);
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
                    LaTeX source
                  </button>
                  {showLatexSource && (
                    <pre className="mt-3 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px] overflow-y-auto" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)'}}>
                      {result.latex}
                    </pre>
                  )}
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground italic border-t pt-3">
                  This draft is a starting point produced by software. It is not
                  legal advice. Have it reviewed by a qualified attorney in your
                  jurisdiction before signing.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
