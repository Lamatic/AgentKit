"use client";

import { useState } from "react";
import { assessVehicle } from "@/actions/orchestrate";
import type {
  AssessmentInput,
  AssessmentReport,
} from "@/features/assessment/types/assessment";
import { SAMPLE_REPORT } from "@/features/assessment/types/sample-report";

export function useAssessment() {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitAssessment(input: AssessmentInput): Promise<void> {
    setIsLoading(true);
    setError(null);
    setReport(null);

    const result = await assessVehicle(input);
    setIsLoading(false);

    if (result.success && result.report) {
      setReport(result.report);
      return;
    }
    setError(result.error ?? "The assessment could not be completed.");
  }

  function showSampleReport(): void {
    setError(null);
    setReport(SAMPLE_REPORT);
  }

  function clearReport(): void {
    setError(null);
    setReport(null);
  }

  return { report, error, isLoading, submitAssessment, showSampleReport, clearReport };
}
