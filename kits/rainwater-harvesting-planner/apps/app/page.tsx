"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Droplets } from "lucide-react";
import { planRainwaterSystem, type PlannerInput, type PlannerResult } from "@/actions/orchestrate";
import { PlannerForm } from "@/components/planner-form";
import { Results } from "@/components/results";

export default function Home() {
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(input: PlannerInput) {
    startTransition(async () => {
      setResult(await planRainwaterSystem(input));
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Droplets className="h-6 w-6" />
          <span className="text-sm font-semibold uppercase tracking-wide">Lamatic AgentKit</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Rainwater Harvesting Planner</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Size a rooftop rainwater system from five years of real rainfall for your city, then get a practical plan for
          the tank, filters, recharge pit and upkeep.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] print:block">
        <div className="lg:sticky lg:top-6 lg:self-start print:hidden">
          <PlannerForm loading={pending} onSubmit={handleSubmit} />
          <p className="mt-3 text-xs text-muted">
            Rainfall: Open-Meteo historical weather (ERA5). Estimates only — confirm local rules and get an expert to check
            structural and plumbing work.
          </p>
        </div>

        <section aria-live="polite">
          {!result && !pending && (
            <div className="card flex h-full min-h-64 flex-col items-center justify-center text-center text-sm text-muted">
              <Droplets className="mb-2 h-8 w-8 text-primary" />
              Enter your roof and household details to see how much rain you can catch.
            </div>
          )}
          {pending && (
            <div className="card min-h-64 animate-pulse text-sm text-muted">
              Looking up five years of rainfall and sizing your tank…
            </div>
          )}
          {!pending && result && !result.ok && (
            <div className="card flex gap-3 border-warn bg-warn-soft text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warn" />
              <p>{result.error}</p>
            </div>
          )}
          {!pending && result && result.ok && <Results result={result} />}
        </section>
      </div>
    </main>
  );
}
