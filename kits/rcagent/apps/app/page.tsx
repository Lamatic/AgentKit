"use client";

import React, { useState } from "react";
import IncidentForm from "../components/incident-form";
import PipelineView, { StepStatus } from "../components/pipeline-view";
import RcaReport from "../components/rca-report";
import { executePipelineStep, PipelineInputs } from "../actions/orchestrate";

export default function RcaPage() {
  const [pipelineSteps, setPipelineSteps] = useState<StepStatus[]>([
    {
      id: "step1",
      name: "Planner Agent",
      description: "Generates custom diagnostic investigation plan checklist",
      status: "idle",
    },
    {
      id: "step2",
      name: "Analyzer Agent",
      description: "Inspects logs, code changes and configuration sets",
      status: "idle",
    },
    {
      id: "step3",
      name: "Synthesizer Agent",
      description: "Assembles SRE Postmortem Root Cause Analysis report",
      status: "idle",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);

  const startPipeline = async (formInputs: {
    incidentTitle: string;
    alertDetails: string;
    logsOrSymptoms: string;
    gitDiff: string;
    configSettings: string;
  }) => {
    setIsLoading(true);
    setReportMarkdown(null);

    // Reset steps
    const currentSteps: StepStatus[] = pipelineSteps.map((s) => ({
      ...s,
      status: "idle",
      data: null,
      error: undefined,
    }));
    setPipelineSteps(currentSteps);

    const inputs: PipelineInputs = {
      incidentTitle: formInputs.incidentTitle,
      alertDetails: formInputs.alertDetails,
      logsOrSymptoms: formInputs.logsOrSymptoms,
      gitDiff: formInputs.gitDiff,
      configSettings: formInputs.configSettings,
    };

    const results: Record<string, any> = {};

    try {
      // 1. Run Step 1
      currentSteps[0].status = "active";
      setPipelineSteps([...currentSteps]);
      const res1 = await executePipelineStep("step1", inputs);
      if (!res1.success) throw new Error(res1.error || "Planner flow failed.");
      currentSteps[0].status = "success";
      currentSteps[0].data = res1.data;
      results.step1 = res1.data;
      setPipelineSteps([...currentSteps]);

      // 2. Run Step 2
      currentSteps[1].status = "active";
      setPipelineSteps([...currentSteps]);
      const res2 = await executePipelineStep("step2", inputs, results);
      if (!res2.success) throw new Error(res2.error || "Analyzer flow failed.");
      currentSteps[1].status = "success";
      currentSteps[1].data = res2.data;
      results.step2 = res2.data;
      setPipelineSteps([...currentSteps]);

      // 3. Run Step 3
      currentSteps[2].status = "active";
      setPipelineSteps([...currentSteps]);
      const res3 = await executePipelineStep("step3", inputs, results);
      if (!res3.success) throw new Error(res3.error || "Synthesizer flow failed.");
      currentSteps[2].status = "success";
      currentSteps[2].data = res3.data;
      results.step3 = res3.data;
      setPipelineSteps([...currentSteps]);

      // Output report
      setReportMarkdown(res3.data.postmortem);
    } catch (err: any) {
      console.error(err);
      // Mark active step as failed
      const activeIdx = currentSteps.findIndex((s) => s.status === "active");
      if (activeIdx !== -1) {
        currentSteps[activeIdx].status = "error";
        currentSteps[activeIdx].error = err.message;
      } else {
        currentSteps[0].status = "error";
        currentSteps[0].error = err.message;
      }
      setPipelineSteps([...currentSteps]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Header section */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          RCAgent Incident Room
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          AI-driven collaborative Root Cause Analysis. Input incident logs, review diagnostic plans, and generate production postmortems instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left column: form */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Submit New Incident</h2>
          <IncidentForm onSubmit={startPipeline} isLoading={isLoading} />
        </div>

        {/* Right column: visual tracker */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-lg lg:col-span-1 min-h-[450px]">
          <PipelineView steps={pipelineSteps} />
        </div>
      </div>

      {/* Report area */}
      {reportMarkdown && (
        <div className="space-y-6 pt-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Investigation Report</h2>
          <RcaReport reportMarkdown={reportMarkdown} />
        </div>
      )}
    </div>
  );
}
