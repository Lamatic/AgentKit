"use server";

import { lamaticClient } from "@/lib/lamatic-client";

export interface PaperAnalysis {
  title: string;
  authors: string[];
  year: number;
  problem_statement: string;
  methodology: string;
  key_findings: string[];
  limitations: string[];
  plain_english_summary: string;
  follow_up_questions: string[];
}

export async function analyzePaper(
  pdfUrl: string
): Promise<{ success: boolean; data?: PaperAnalysis; error?: string }> {
  try {
    const flowId = process.env.RESEARCH_PAPER_ANALYZER_FLOW_ID;
    if (!flowId) throw new Error("RESEARCH_PAPER_ANALYZER_FLOW_ID is not set.");

    const resData = await lamaticClient.executeFlow(flowId, { pdf_url: pdfUrl });
    const result = resData?.result ?? resData?.output ?? resData;

    if (!result) throw new Error("No result returned from the flow.");

    return { success: true, data: result as PaperAnalysis };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred.";
    return { success: false, error: message };
  }
}
