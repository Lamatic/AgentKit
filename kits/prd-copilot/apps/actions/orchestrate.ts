"use server"

import { lamaticClient } from "../lib/lamatic-client";
import { config } from "../orchestrate";

export type FlowMode = "draft" | "refine";

export interface OrchestrateResponse {
  success: boolean;
  prd?: string;
  questions?: string[];
  mermaid?: string;
  error?: string;
}

/**
 * Safely parses the LLM output, handling potential markdown wrappers or raw text.
 */
function parseLLMResponse(rawResponse: any): { prd: string; questions: string[]; mermaid: string } {
  const defaultResponse = { prd: "", questions: [], mermaid: "" };

  if (!rawResponse) return defaultResponse;

  let answerString = "";

  // If output is already parsed by Lamatic as an object
  if (typeof rawResponse === "object") {
    // Check if it already has the keys directly
    if (rawResponse.prd || rawResponse.questions || rawResponse.mermaid) {
      return {
        prd: typeof rawResponse.prd === "string" ? rawResponse.prd : "",
        questions: Array.isArray(rawResponse.questions) ? rawResponse.questions : [],
        mermaid: typeof rawResponse.mermaid === "string" ? rawResponse.mermaid : "",
      };
    }
    // If it's another object format, serialize it to parse
    answerString = JSON.stringify(rawResponse);
  } else if (typeof rawResponse === "string") {
    answerString = rawResponse;
  } else {
    return defaultResponse;
  }

  try {
    // Strip markdown code block markers if present: ```json ... ``` or ``` ... ```
    let cleanString = answerString.trim();
    if (cleanString.startsWith("```")) {
      cleanString = cleanString.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleanString);
    return {
      prd: typeof parsed.prd === "string" ? parsed.prd : "",
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      mermaid: typeof parsed.mermaid === "string" ? parsed.mermaid : "",
    };
  } catch (e) {
    console.error("[PRD Copilot] Failed to parse JSON from LLM output. Falling back to treating as raw markdown.", e);
    // If JSON parsing fails, we assume it's just raw markdown text (which is a valid fallback for draft mode)
    return {
      prd: answerString,
      questions: [],
      mermaid: "",
    };
  }
}

export async function orchestratePRD(
  mode: FlowMode,
  instructions: string,
  answers: string = ""
): Promise<OrchestrateResponse> {
  try {
    console.log("[PRD Copilot] Orchestrating flow:", { mode, instructionsLength: instructions.length, answersLength: answers.length });

    const flows = config.flows;
    const flowKey = "prd-copilot";
    const flow = flows[flowKey as keyof typeof flows];

    if (!flow || !flow.workflowId) {
      throw new Error("PRD Copilot flow configuration or Flow ID is missing.");
    }

    const inputs = {
      mode,
      instructions,
      answers,
    };

    console.log("[PRD Copilot] Executing flow with ID:", flow.workflowId);
    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs);
    console.log("[PRD Copilot] Flow execution completed. Status:", resData?.status);

    // Lamatic SDK response mapping normally puts the output inside result?.answer
    const rawAnswer = resData?.result?.answer || (resData as any)?.output?.answer;

    if (!rawAnswer) {
      throw new Error("No answer found in the flow response.");
    }

    const parsed = parseLLMResponse(rawAnswer);

    return {
      success: true,
      prd: parsed.prd,
      questions: parsed.questions,
      mermaid: parsed.mermaid,
    };
  } catch (error) {
    console.error("[PRD Copilot] Error executing flow:", error);

    let errorMessage = "An unknown error occurred while contacting Lamatic.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: Unable to reach Lamatic. Please check your credentials and internet connection.";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
