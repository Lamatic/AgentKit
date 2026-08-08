"use server";

import { getLamaticClient } from "@/lib/lamatic-client";
import { parseScorecard, splitInterviewerNotes, type Scorecard } from "@/lib/scorecard";
import kitConfig from "../../lamatic.config";

export type CalibrateInput = {
  jobTitle: string;
  level: string;
  rubric: string;
  interviewerNotes: string;
};

export type CalibrateResult = {
  success: boolean;
  data?: {
    scorecard: Scorecard;
    brief: string;
    raw: unknown;
  };
  error?: string;
};

/** Resolve the deployed calibrate-scorecard flow ID from kit-root lamatic.config. */
function getCalibrateFlowId() {
  const step = kitConfig.steps.find((s) => s.id === "calibrate-scorecard");
  if (!step?.envKey) {
    throw new Error(
      'lamatic.config has no step "calibrate-scorecard" with an envKey',
    );
  }

  const flowId = process.env[step.envKey];
  if (!flowId) {
    throw new Error(
      `${step.envKey} is not set. Set ${step.envKey} in the application environment.`,
    );
  }
  return flowId;
}

/** Parse a JSON string when possible; otherwise return the original value. */
function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Invokes the Lamatic calibrate-scorecard flow and validates the structured response.
 */
export async function calibrateScorecard(
  input: CalibrateInput,
): Promise<CalibrateResult> {
  try {
    const jobTitle = input.jobTitle.trim();
    const rubric = input.rubric.trim();
    const interviewerNotes = input.interviewerNotes.trim();
    const level = input.level.trim();

    if (!jobTitle) throw new Error("Job title is required");
    if (!rubric) throw new Error("Competency rubric is required");
    if (!interviewerNotes) throw new Error("Interviewer notes are required");

    const interviewerBlocks = splitInterviewerNotes(interviewerNotes);
    if (interviewerBlocks.length < 2) {
      throw new Error(
        "Provide notes from at least two interviewers, separated by '---' or 'Interviewer N:' headings",
      );
    }

    const flowId = getCalibrateFlowId();
    const lamaticClient = getLamaticClient();
    const resData = await lamaticClient.executeFlow(flowId, {
      job_title: jobTitle,
      level: level || "Unspecified",
      rubric,
      interviewer_notes: interviewerNotes,
    });

    const result =
      (resData as { result?: Record<string, unknown> })?.result || resData;
    const scorecardRaw = parseMaybeJson(
      (result as Record<string, unknown>)?.scorecard ??
        (result as Record<string, unknown>)?.answer ??
        result,
    );
    const scorecard = parseScorecard(scorecardRaw);
    if (!scorecard) {
      throw new Error(
        "Flow returned an invalid scorecard payload. Check the deployed flow output schema.",
      );
    }

    const brief =
      typeof (result as Record<string, unknown>)?.brief === "string"
        ? ((result as Record<string, unknown>).brief as string)
        : "";

    return {
      success: true,
      data: {
        scorecard,
        brief,
        raw: resData,
      },
    };
  } catch (error) {
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic. Check your internet connection and API URL.";
      } else if (error.message.toLowerCase().includes("api key")) {
        errorMessage = "Authentication error: Please check your Lamatic API key.";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
