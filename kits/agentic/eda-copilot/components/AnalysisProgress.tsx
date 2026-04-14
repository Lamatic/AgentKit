"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

type Step = "parsing" | "schema" | "statistical" | "mlReadiness" | "done" | "error" | "idle";

const STEPS: { id: Step; label: string; description: string }[] = [
  {
    id: "schema",
    label: "Schema Analysis",
    description: "Detecting types, missing data, and data quality issues",
  },
  {
    id: "statistical",
    label: "Statistical Insights",
    description: "Analyzing distributions, correlations, and outliers",
  },
  {
    id: "mlReadiness",
    label: "ML Readiness Assessment",
    description: "Scoring dataset and generating preprocessing recommendations",
  },
];

const ORDER: Step[] = ["schema", "statistical", "mlReadiness", "done"];

function getStepStatus(
  stepId: Step,
  currentStep: Step
): "done" | "active" | "pending" {
  const currentIdx = ORDER.indexOf(currentStep);
  const stepIdx = ORDER.indexOf(stepId);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export default function AnalysisProgress({ step }: { step: Step }) {
  return (
    <div className="glass rounded-2xl p-6">
      <p className="text-sm font-medium text-slate-300 mb-6">
        Running AI analysis pipeline…
      </p>
      <div className="space-y-4">
        {STEPS.map((s, i) => {
          const status = getStepStatus(s.id, step);
          return (
            <div key={s.id} className="flex items-start gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    status === "done" &&
                      "bg-emerald-500 border-emerald-500 text-white",
                    status === "active" &&
                      "border-sky-500 bg-sky-500/20 text-sky-400",
                    status === "pending" &&
                      "border-slate-700 bg-slate-800 text-slate-600"
                  )}
                >
                  {status === "done" ? (
                    <Check className="w-4 h-4" />
                  ) : status === "active" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-8 mt-1 transition-colors",
                      status === "done" ? "bg-emerald-500/50" : "bg-slate-800"
                    )}
                  />
                )}
              </div>

              {/* Step info */}
              <div className="pt-1">
                <p
                  className={cn(
                    "font-medium text-sm transition-colors",
                    status === "done" && "text-emerald-400",
                    status === "active" && "text-sky-300",
                    status === "pending" && "text-slate-600"
                  )}
                >
                  {s.label}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5 transition-colors",
                    status === "active" ? "text-slate-400" : "text-slate-600"
                  )}
                >
                  {s.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
