"use client";

import { useState } from "react";
import { assessVehicle } from "@/actions/orchestrate";
import type {
  AssessmentInput,
  AssessmentReport,
} from "@/features/assessment/types/assessment";
import { SAMPLE_REPORT } from "@/features/assessment/types/sample-report";

const ASSESSMENT_FAILURE_MESSAGE = "The assessment could not be completed.";

export function useAssessment() {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitAssessment(input: AssessmentInput): Promise<void> {
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await assessVehicle(input);
      if (result.success && result.report) {
        setReport(result.report);
        return;
      }
      setError(result.error ?? ASSESSMENT_FAILURE_MESSAGE);
    } catch {
      setError(ASSESSMENT_FAILURE_MESSAGE);
    } finally {
      setIsLoading(false);
    }
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
