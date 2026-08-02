"use client";

import { useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ListTree,
  Loader2,
  Play,
  Radio,
  Sparkles,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { cn } from "../components/ui/utils";

import { PipelineSummaryCard } from "../components/PipelineSummaryCard";
import { HypothesisCard } from "../components/HypothesisCard";
import { DecisionCard } from "../components/DecisionCard";
import { RepoInsightCard } from "../components/RepoInsightCard";
import { StepPanel } from "../components/StepPanel";
import { RootCauseReport } from "../components/RootCauseReport";
import { ThemeToggle } from "../components/ThemeToggle";
import { useInvestigation } from "../components/useInvestigation";

import type { ExecutionMode, RunInvestigationInput } from "../lib/contracts";

const STATUS_COPY: Record<string, string> = {
  ingesting: "Reading pipeline…",
  investigating: "Investigating…",
  reporting: "Synthesizing root cause…",
  done: "Investigation complete",
  error: "Investigation failed",
  cancelled: "Investigation cancelled",
};

export default function SparkTracePage() {
  const [symptom, setSymptom] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [useDemoScenario, setUseDemoScenario] = useState(true);
  // Mode is derived from the source selection, never chosen independently —
  // a demo scenario always runs in demo mode, a custom repo always in live
  // mode, so the two can never be submitted mismatched.
  const mode: ExecutionMode = useDemoScenario ? "demo" : "live";

  const { investigation, isRunning, error, start, reset } = useInvestigation();

  const canSubmit = symptom.trim().length > 0 && !isRunning && (useDemoScenario || repoUrl.trim().length > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const input: RunInvestigationInput = {
      symptom: symptom.trim(),
      mode,
      source: useDemoScenario
        ? { scenarioId: "demo" }
        : { repoUrl: repoUrl.trim() },
    };

    await start(input);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none tracking-tight">SparkTrace</h1>
            <p className="text-xs text-muted-foreground">Agentic Spark pipeline debugging copilot</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTree className="size-4 text-muted-foreground" />
            Start an investigation
          </CardTitle>
          <CardDescription>
            Describe the data symptom you&apos;re seeing and point SparkTrace at the pipeline repo, or run the
            bundled demo scenario offline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="symptom" className="text-sm font-medium">
                Symptom
              </label>
              <Textarea
                id="symptom"
                placeholder='e.g. "Daily revenue in the sink table has been ~12% lower than expected since Tuesday"'
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                disabled={isRunning}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="repoUrl" className="text-sm font-medium">
                    Pipeline repo URL
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseDemoScenario((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      useDemoScenario
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                    disabled={isRunning}
                  >
                    <Radio className="size-3" />
                    Use demo scenario
                  </button>
                </div>
                <Input
                  id="repoUrl"
                  placeholder="https://github.com/org/pipeline-repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={isRunning || useDemoScenario}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mode</label>
                {/* Derived from "Use demo scenario", not independently selectable —
                    see the mode/useDemoScenario coupling above handleSubmit. */}
                <div className="flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium capitalize text-muted-foreground">
                  {mode}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!canSubmit}>
                {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                {isRunning ? "Investigating…" : "Start investigation"}
              </Button>
              {investigation && !isRunning && (
                <Button type="button" variant="ghost" onClick={reset}>
                  New investigation
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {investigation && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={investigation.status === "error" ? "destructive" : "outline"} className="gap-1.5">
              {isRunning ? <Loader2 className="size-3 animate-spin" /> : <Activity className="size-3" />}
              {STATUS_COPY[investigation.status] ?? investigation.status}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{investigation.id}</span>
            <Badge variant="secondary" className="font-mono">
              {investigation.mode}
            </Badge>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {investigation.pipeline.files.length > 0 || investigation.pipeline.summary ? (
            <PipelineSummaryCard pipeline={investigation.pipeline} />
          ) : null}

          {investigation.decisions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Planner</h2>
              <div className="space-y-3">
                {investigation.decisions.map((d, i) => (
                  <DecisionCard key={i} decision={d} index={i + 1} />
                ))}
              </div>
            </div>
          )}

          {investigation.repoInsights.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Repo insights</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {investigation.repoInsights.map((insight, i) => (
                  <RepoInsightCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {investigation.hypotheses.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Hypotheses tracked</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {investigation.hypotheses.map((h) => (
                  <HypothesisCard key={h.id} hypothesis={h} />
                ))}
              </div>
            </div>
          )}

          {investigation.steps.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Investigation steps</h2>
              <div className="space-y-4">
                {investigation.steps.map((step, i) => (
                  <StepPanel key={step.query.id} step={step} index={i + 1} />
                ))}
              </div>
            </div>
          )}

          {investigation.report && <RootCauseReport report={investigation.report} />}
        </section>
      )}
    </div>
  );
}
