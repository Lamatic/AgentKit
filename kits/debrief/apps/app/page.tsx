"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { Loader2, Sparkles, Plus, Trash2, Copy, Check, RotateCcw } from "lucide-react";
import { summarizeFeedback, type DebriefOutput } from "@/actions/orchestrate";

export default function DebriefPage() {
  const [rounds, setRounds] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebriefOutput | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const addRound = () => {
    setRounds((prev) => [...prev, ""]);
  };

  const removeRound = (idx: number) => {
    setRounds((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRound = (idx: number, value: string) => {
    setRounds((prev) => prev.map((r, i) => (i === idx ? value : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasContent = rounds.some((r) => r.trim().length > 0);
    if (!hasContent) {
      setError("Paste at least one round of feedback before submitting.");
      return;
    }
    setIsLoading(true);
    setError("");
    setResult(null);
    setIsFallback(false);
    setCopied(false);

    // Tag each block by round before it reaches the model, per PRD 5.2
    const tagged =
      rounds.length === 1
        ? rounds[0].trim()
        : rounds
            .map((r, i) => `Round ${i + 1}:\n${r.trim()}`)
            .filter((block) => block.replace(/^Round \d+:\n/, "").trim().length > 0)
            .join("\n\n");

    try {
      const response = await summarizeFeedback(tagged);
      if (response.success && response.data) {
        setResult(response.data);
        setIsFallback(Boolean(response.fallback));
      } else {
        setError(response.error || "Summarization failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setIsFallback(false);
    setError("");
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  const clearAll = () => {
    setRounds([""]);
    setResult(null);
    setIsFallback(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-foreground">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8">
        {!result ? (
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-semibold tracking-tight">Debrief</h1>
              <p className="mt-2 text-muted-foreground">
                Paste messy interview notes — bullet fragments, Slack pastes, or prose. Add rounds, then
                get strengths, gaps, and action items in seconds.
              </p>
            </div>

            <Card className="bg-white/90 shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {rounds.map((value, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`round-${idx}`}>
                          {rounds.length === 1 ? "Feedback" : `Round ${idx + 1}`}
                        </Label>
                        {rounds.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRound(idx)}
                            disabled={isLoading}
                            className="h-7 text-muted-foreground"
                            aria-label={`Remove round ${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id={`round-${idx}`}
                        placeholder={
                          idx === 0
                            ? "Paste feedback here — e.g.\n- strong system design, clear comms\n- struggled with DB indexing detail\nSlack: 'candidate was collaborative, missed edge cases...'"
                            : `Paste notes for round ${idx + 1}...`
                        }
                        value={value}
                        onChange={(e) => updateRound(idx, e.target.value)}
                        className="min-h-[160px] resize-y"
                        disabled={isLoading}
                      />
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRound}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add another round
                    </Button>
                    {rounds.some((r) => r.length > 0) && (
                      <Button type="button" variant="ghost" onClick={clearAll} disabled={isLoading}>
                        Clear
                      </Button>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="h-11 w-full gap-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Summarizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Summarize feedback
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    No persistence, no auth. Stateless — your notes are sent once to the Lamatic flow
                    and never stored.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-semibold">Your Debrief</h2>
              <p className="mt-1 text-muted-foreground">Structured summary ready to share</p>
            </div>

            <Card className="bg-white/90 shadow-sm">
              {isFallback && (
                <p className="rounded-t-lg bg-amber-50 px-4 py-2 text-xs text-amber-800">
                  Local fallback mode. Lamatic credentials missing, so this is keyword based, not model output.
                </p>
              )}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">Result</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy JSON
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <section className="rounded-lg bg-muted/50 p-4">
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Summary
                  </h3>
                  <p className="text-sm leading-relaxed">{result.summary}</p>
                </section>

                <div className="grid gap-6 md:grid-cols-3">
                  <section>
                    <h3 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      Strengths
                    </h3>
                    {result.strengths.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No strengths evidenced.</p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {result.strengths.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                      Gaps
                    </h3>
                    {result.gaps.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No gaps flagged.</p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {result.gaps.map((g: string, i: number) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                      Action items
                    </h3>
                    {result.action_items.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No actions suggested.</p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {result.action_items.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>

                <details className="rounded-md border p-3">
                  <summary className="cursor-pointer text-sm font-medium">Raw JSON</summary>
                  <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>

                <Button onClick={handleReset} variant="outline" className="w-full gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Summarize more feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
