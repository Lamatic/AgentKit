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

    // Check if API key, Project ID, or Flow ID is set
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
    const resData = res as any;

    // Response received

    // Check if Lamatic returned an explicit error
    if (resData?.status === "error" || resData?.statusCode >= 400) {
      const msg = resData?.message || "Workflow execution failed";
      throw new Error(`Lamatic flow error: ${msg}. Please check your flow configuration in Lamatic Studio — ensure the LLM node has valid model credentials and the flow is published.`);
    }

    let answer =
      resData?.result?.answer?.output?.generatedResponse ||
      resData?.result?.answer?.generatedResponse ||
      resData?.result?.answer?.data ||
      resData?.result?.answer ||
      resData?.result?.output?.generatedResponse ||
      resData?.result?.output ||
      resData?.result?.generatedResponse ||
      resData?.result?.response ||
      resData?.result?.content ||
      resData?.data?.answer ||
      resData?.data ||
      resData?.result ||
      resData?.output?.generatedResponse ||
      resData?.output ||
      resData?.answer;

    if (!answer || (typeof answer === "object" && Object.keys(answer).length === 0)) {
      throw new Error("No architectural data returned from Lamatic flow. Raw response: " + JSON.stringify(resData).substring(0, 300));
    }

    if (typeof answer === "string") {
      let trimmed = answer.trim();
      if (trimmed.startsWith("<!") || trimmed.startsWith("<html") || trimmed.startsWith("<")) {
        throw new Error("Received HTML error page from Lamatic API endpoint. Please verify your LAMATIC_API_URL and check that your Flow is deployed and published in Lamatic Studio.");
      }
      if (trimmed.startsWith("```")) {
        trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      
      // Fallback: forcefully extract JSON block if it exists
      const firstBrace = trimmed.indexOf("{");
      const lastBrace = trimmed.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        trimmed = trimmed.substring(firstBrace, lastBrace + 1);
      }
      try {
        answer = JSON.parse(trimmed);
      } catch (parseErr) {
        console.error("JSON parse error on answer payload:", parseErr);
        throw new Error("Invalid JSON returned from Lamatic flow. Showing simulated ADR structure.");
      }
    }

    return {
      success: true,
      data: answer,
    };
  } catch (err: any) {
    console.error("ADR Generation error:", err);
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
