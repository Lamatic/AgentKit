"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

export interface TrustReportFlag {
  region: string;
  signal: "metadata" | "font_spacing" | "ela" | "vlm";
  confidence: number;
  explanation: string;
}

export interface TrustReport {
  risk_score: number;
  verdict: string;
  verdict_color: "green" | "amber" | "orange" | "red";
  flags: TrustReportFlag[];
  signal_breakdown: {
    metadata: { flags: number; score_contribution: number };
    font_spacing: { flags: number; score_contribution: number };
    ela: { flags: number; score_contribution: number };
    vlm: { flags: number; score_contribution: number };
  };
  document_info: {
    file_name: string;
    file_type: string;
    analyzed_at: string;
  };
  disclaimer: string;
}

export async function analyzeDocument(
  fileBase64: string,
  fileName: string,
  fileType: string,
  ocrBoxes: any[] = []
): Promise<{
  success: boolean;
  data?: TrustReport;
  error?: string;
}> {
  try {
    console.log("[document-tamper-detector] Analyzing document:", { fileName, fileType })

    const flow = config.flows.documentTamperDetector;

    if (!flow.workflowId) {
      throw new Error("DOCUMENT_TAMPER_DETECTOR_FLOW_ID is not configured.")
    }

    const inputs = {
      fileBase64,
      fileName,
      fileType,
      ocrBoxes,
    }

    console.log("[document-tamper-detector] Executing flow:", flow.workflowId)
    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[document-tamper-detector] Flow response received")

    const trustReport = resData?.result?.trustReport

    if (!trustReport) {
      throw new Error("No trust report returned from the analysis flow.")
    }

    return {
      success: true,
      data: trustReport as TrustReport,
    }
  } catch (error) {
    console.error("[document-tamper-detector] Analysis error:", error)

    let errorMessage = "Unknown error occurred during document analysis."
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: Unable to connect to the Lamatic service. Please check your internet connection and API configuration."
      } else if (error.message.includes("API key") || error.message.includes("Unauthorized")) {
        errorMessage = "Authentication error: Please check your LAMATIC_API_KEY configuration."
      } else if (error.message.includes("Flow ID") || error.message.includes("not found")) {
        errorMessage = "Flow configuration error: The document analysis flow ID is invalid or the flow has not been deployed."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
