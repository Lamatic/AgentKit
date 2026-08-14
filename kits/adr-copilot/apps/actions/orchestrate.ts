"use server";

import { getLamaticClient, flowId } from "@/lib/lamatic-client";

export interface ADRResult {
  adrNumber?: string;
  title: string;
  status: "Accepted" | "Proposed" | "Rejected" | "Draft";
  context: string;
  decisionDrivers?: string[];
  consideredOptions?: Array<{
    name: string;
    description: string;
    pros: string[];
    cons: string[];
  }>;
  chosenOption?: string;
  consequences?: {
    positive: string[];
    negative: string[];
  };
  mermaidDiagram?: string;
  markdownContent: string;
}

export async function generateADR(
  instructions: string,
  constraints: string = ""
): Promise<{
  success: boolean;
  data?: ADRResult;
  error?: string;
  isFallback?: boolean;
}> {
  try {
    if (!instructions || instructions.trim().length < 5) {
      return {
        success: false,
        error: "Please provide a detailed technical design proposal or architectural decision instructions.",
      };
    }

    const apiKey = process.env.LAMATIC_API_KEY;
    const projectId = process.env.LAMATIC_PROJECT_ID;
    const currentFlowId = process.env.LAMATIC_FLOW_ID || flowId;

    const client = getLamaticClient();

    if (!apiKey || !projectId || !currentFlowId || !client) {
      return {
        success: false,
        error: "Lamatic SDK initialization failed. API Key, Project ID, or Flow ID is missing in .env.local.",
      };
    }

    const payload = {
      instructions,
      constraints,
    };


    const res = await client.executeFlow(currentFlowId, payload);
    const flowResult = res as any;

    if (flowResult?.status === "error" || flowResult?.statusCode >= 400) {
      const msg = flowResult?.message || "Workflow execution failed";
      throw new Error(`Lamatic flow error: ${msg}. Please check your flow configuration in Lamatic Studio — ensure the LLM node has valid model credentials and the flow is published.`);
    }

    let answer =
      flowResult?.result?.answer?.output?.generatedResponse ||
      flowResult?.result?.answer?.generatedResponse ||
      flowResult?.result?.answer?.data ||
      flowResult?.result?.answer ||
      flowResult?.result?.output?.generatedResponse ||
      flowResult?.result?.output ||
      flowResult?.result?.generatedResponse ||
      flowResult?.result?.response ||
      flowResult?.result?.content ||
      flowResult?.data?.answer ||
      flowResult?.data ||
      flowResult?.result ||
      flowResult?.output?.generatedResponse ||
      flowResult?.output;

    if (!answer || (typeof answer === "object" && Object.keys(answer).length === 0)) {
      throw new Error("No architectural data returned from Lamatic flow. Raw response: " + JSON.stringify(flowResult).substring(0, 300));
    }

    if (typeof answer === "string") {
      let trimmed = answer.trim();
      if (trimmed.startsWith("<!") || trimmed.startsWith("<html") || trimmed.startsWith("<")) {
        throw new Error("Received HTML error page from Lamatic API endpoint. Please verify your LAMATIC_API_URL and check that your Flow is deployed and published in Lamatic Studio.");
      }
      if (trimmed.startsWith("```")) {
        trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      
      const firstBrace = trimmed.indexOf("{");
      const lastBrace = trimmed.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        trimmed = trimmed.substring(firstBrace, lastBrace + 1);
      }
      try {
        answer = JSON.parse(trimmed);
      } catch (parseErr) {
        throw new Error("The flow returned a response that could not be parsed as JSON. Please check that the LLM node prompt instructs the model to return valid JSON.");
      }
    }

    return {
      success: true,
      data: answer,
    };
  } catch (err: any) {
    let userFriendlyMsg = err?.message || "Failed to communicate with Lamatic API.";
    if (
      userFriendlyMsg.includes("Unexpected token") ||
      userFriendlyMsg.includes("<!doctype") ||
      userFriendlyMsg.includes("is not valid JSON")
    ) {
      userFriendlyMsg = "The Lamatic API endpoint returned an HTML error page (404/500) instead of JSON. Please verify your LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_FLOW_ID in .env.local, and ensure the flow is published in Lamatic Studio.";
    }
    return {
      success: false,
      error: `Live API Notice: ${userFriendlyMsg}`,
    };
  }
}
