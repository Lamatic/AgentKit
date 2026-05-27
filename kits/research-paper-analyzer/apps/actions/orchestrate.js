"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { flows } from "../orchestrate.js";

export async function analyzePaper(pdfUrl) {
  try {
    console.log("[research-paper-analyzer] Analyzing PDF:", pdfUrl);

    const flow = flows["research-paper-analyzer"];

    if (!flow.workflowId) {
      throw new Error("Workflow ID not configured. Check your .env.local file.");
    }

    const resData = await lamaticClient.executeFlow(flow.workflowId, {
      pdf_url: pdfUrl,
    });

    console.log("[research-paper-analyzer] Raw response:", resData);

    const analysis = resData?.result?.output ?? resData?.result?.answer;

    if (!analysis) {
      throw new Error("No analysis returned from the workflow.");
    }

    return { success: true, data: analysis };
  } catch (error) {
    console.error("[research-paper-analyzer] Error:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: unable to connect. Check your internet connection.";
      } else if (
        error.message.includes("API key") ||
        error.message.includes("401")
      ) {
        errorMessage = "Authentication error: please check your API credentials.";
      }
    }

    return { success: false, error: errorMessage };
  }
}
