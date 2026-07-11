import React from "react";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";

export interface StepStatus {
  id: string;
  name: string;
  description: string;
  status: "idle" | "active" | "success" | "error";
  data?: any;
  error?: string;
}

interface PipelineViewProps {
  steps: StepStatus[];
}

export default function PipelineView({ steps }: PipelineViewProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Investigation Progress</h3>
      <div className="relative border-l-2 border-slate-200 dark:border-slate-700 pl-6 ml-3 space-y-8">
        {steps.map((step) => {
          const isActive = step.status === "active";
          const isSuccess = step.status === "success";
          const isError = step.status === "error";

          return (
            <div key={step.id} className="relative">
              {/* Status Icon */}
              <div className="absolute -left-10 top-0.5 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-full p-1.5 border border-slate-200 dark:border-slate-700">
                {isActive && <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {step.status === "idle" && <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
              </div>

              {/* Step info */}
              <div className="space-y-2">
                <div>
                  <h4 className={`text-base font-semibold ${isActive ? "text-slate-950 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                    {step.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-450">{step.description}</p>
                </div>

                {/* Intermediate Output details */}
                {isSuccess && step.data && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-350 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {step.id === "step1" && step.data.steps}
                    {step.id === "step2" && step.data.research}
                    {step.id === "step3" && "RCA analysis completed. Postmortem report compiled below."}
                  </div>
                )}

                {/* Error message */}
                {isError && step.error && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900 text-xs font-mono text-rose-600 dark:text-rose-400">
                    Error: {step.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
