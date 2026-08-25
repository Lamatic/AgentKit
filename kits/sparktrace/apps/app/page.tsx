"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { ShowcaseNotice } from "../components/ShowcaseNotice";
import { ArchitectureVision } from "../components/ArchitectureVision";
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

// A demo scenario always runs in demo mode, a custom repo always in live
// mode, so `useDemoScenario` and `mode` can never be submitted mismatched —
// `repoUrl` is only required (and URL-validated) once demo mode is off.
const formSchema = z
  .object({
    symptom: z.string().trim().min(1, "Describe the symptom you're seeing."),
    useDemoScenario: z.boolean(),
    repoUrl: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.useDemoScenario) return;
    if (!data.repoUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a pipeline repo URL.", path: ["repoUrl"] });
      return;
    }
    if (!z.string().url().safeParse(data.repoUrl).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid URL.", path: ["repoUrl"] });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export default function SparkTracePage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { symptom: "", useDemoScenario: true, repoUrl: "" },
  });

  const useDemoScenario = watch("useDemoScenario");
  // Mode is derived from the source selection, never chosen independently.
  const mode: ExecutionMode = useDemoScenario ? "demo" : "live";

  const { investigation, isRunning, error, start, reset } = useInvestigation();

  // Which scenario demo mode will run. Served by /api/scenario from the
  // bundled scenario.json so the id has exactly one source of truth; a
  // failed fetch just leaves the generic label in place.
  const [scenario, setScenario] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/scenario")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.id) return;
        setScenario({ id: data.id, title: data.title });

        // Land-and-click: the bundled scenario ships with the symptom a
        // data engineer would actually report, so demo mode starts from
        // it rather than from an empty box the visitor has to invent
        // something for. Only ever fills a field the user hasn't touched,
        // and it stays fully editable.
        if (data.symptom && getValues("useDemoScenario") && !getValues("symptom").trim()) {
          setValue("symptom", data.symptom, { shouldValidate: true });
        }
      })
      .catch(() => {
        /* label stays generic */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = isValid && !isRunning;

  const onSubmit = async (data: FormValues) => {
    const input: RunInvestigationInput = {
      symptom: data.symptom.trim(),
      mode,
      // Demo mode bundles exactly one scenario, and the ingestor selects
      // it when no id is given. Naming it here would mean the client
      // hardcoding an id that lives in the bundled scenario.json — which
      // is how this previously sent "demo" (the mode) as a scenario id
      // and failed ingestion outright.
      source: useDemoScenario ? {} : { repoUrl: data.repoUrl.trim() },
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

      {/* Only claim the models are stubbed when they actually are — a
          local run against a real repo uses the deployed flows. */}
      {mode === "demo" && <ShowcaseNotice />}

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="symptom" className="text-sm font-medium">
                Symptom
              </label>
              <Textarea
                id="symptom"
                placeholder='e.g. "Daily revenue in the sink table has been ~12% lower than expected since Tuesday"'
                disabled={isRunning}
                rows={3}
                {...register("symptom")}
              />
              {errors.symptom && <p className="text-xs text-destructive">{errors.symptom.message}</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="repoUrl" className="text-sm font-medium">
                    {useDemoScenario ? "Demo scenario" : "Pipeline repo URL"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setValue("useDemoScenario", !useDemoScenario, { shouldValidate: true })}
                    aria-pressed={useDemoScenario}
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
                {/* In demo mode the source is the bundled scenario, not a
                    URL. Showing it in a separate read-only field (rather
                    than writing it into repoUrl) keeps the scenario id out
                    of form state, so toggling back to a real repo leaves
                    the input empty instead of pre-filled with garbage. */}
                {useDemoScenario ? (
                  <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3">
                    <span className="truncate font-mono text-sm text-foreground">
                      {scenario?.id ?? "bundled demo scenario"}
                    </span>
                  </div>
                ) : (
                  <Input
                    id="repoUrl"
                    placeholder="https://github.com/org/pipeline-repo"
                    disabled={isRunning}
                    {...register("repoUrl")}
                  />
                )}
                {errors.repoUrl && !useDemoScenario && (
                  <p className="text-xs text-destructive">{errors.repoUrl.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mode</label>
                {/* Derived from "Use demo scenario", not independently selectable —
                    see the mode/useDemoScenario coupling in the zod schema above. */}
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
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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

      {/* Below the fold on purpose — someone who came to try it should
          reach the form first, not an essay. */}
      <ArchitectureVision />
    </div>
  );
}
