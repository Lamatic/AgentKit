"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, BarChart3, Download, Loader2 } from "lucide-react";

import { analyze, type AnalyzeResult } from "../actions/orchestrate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const SAMPLES: { label: string; url: string }[] = [
  { label: "Titanic", url: "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv" },
  { label: "Iris", url: "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" },
  { label: "Air travel", url: "https://people.sc.fsu.edu/~jburkardt/data/csv/airtravel.csv" },
];

const formSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a CSV URL.")
    .url("Enter a valid URL.")
    .refine((u) => /^https?:\/\//i.test(u), "Only http(s) CSV URLs are supported."),
});
type FormValues = z.infer<typeof formSchema>;

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<AnalyzeResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: SAMPLES[0].url },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setRes(null);
    try {
      setRes(await analyze(values.url.trim()));
    } catch (e: any) {
      setRes({ ok: false, error: String(e?.message || e) || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!res?.dashboardHtml) return;
    const blob = new Blob([res.dashboardHtml], { type: "text/html" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "eda-dashboard.html";
    a.click();
    URL.revokeObjectURL(u);
  }

  const urlError = form.formState.errors.url?.message;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-7">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="size-6 text-primary" />
          EDA Analyst
        </h1>
        <p className="text-muted-foreground mt-1">
          Give it a CSV URL — the agent cleans the data, decides what to analyze, and builds a dashboard.
        </p>
      </header>

      <Card>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
            <Label htmlFor="csv-url">CSV URL</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="csv-url"
                placeholder="https://example.com/data.csv"
                className="min-w-[280px] flex-1"
                aria-invalid={!!urlError}
                disabled={loading}
                {...form.register("url")}
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>
            {urlError && <p className="text-destructive text-sm">{urlError}</p>}
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Try:</span>
            {SAMPLES.map((s) => (
              <Button
                key={s.label}
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => form.setValue("url", s.url, { shouldValidate: false })}
              >
                {s.label}
              </Button>
            ))}
          </div>

          <p className="text-muted-foreground mt-3 text-xs">
            Must be a public, direct-download CSV link. Analysis runs several reasoning steps, so it can take up to a minute.
          </p>

          {loading && (
            <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Profiling → cleaning → analyzing → rendering…
            </div>
          )}
          {res && !res.ok && (
            <div className="text-destructive border-destructive/40 bg-destructive/10 mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <AlertCircle className="size-4" />
              {res.error || "Something went wrong."}
            </div>
          )}
          {res && res.ok && !res.dashboardHtml && (
            <div className="text-destructive mt-4 text-sm">No dashboard was returned by the agent.</div>
          )}
        </CardContent>
      </Card>

      {res?.ok && res.dashboardHtml && (
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {typeof res.validated === "boolean" && (
                <Badge variant={res.validated ? "default" : "destructive"}>
                  {res.validated ? "✓ cleaned & validated" : "⚠ cleaning reverted"}
                </Badge>
              )}
              {typeof res.chartCount === "number" && (
                <Badge variant="secondary">{res.chartCount} charts</Badge>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={download}>
              <Download className="size-4" />
              Download .html
            </Button>
          </div>
          <iframe
            title="EDA dashboard"
            srcDoc={res.dashboardHtml}
            sandbox="allow-scripts"
            className="bg-background h-[78vh] w-full rounded-xl border"
          />
        </section>
      )}
    </main>
  );
}
