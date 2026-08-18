"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate";
import type { PrepBrief, ArchitectureAnalysis, GrillQuestion, ProductionReadiness, RepoAnalysis } from "@/lib/types";

import { jsonrepair } from "jsonrepair";

// Helper to robustly parse JSON from string
function safeParse<T>(raw: any, fallbackName: string): T {
  if (!raw) {
    throw new Error(`No ${fallbackName} found in response. Check workflow output configuration.`);
  }
  
  try {
    const jsonStr = typeof raw === "string" ? raw : JSON.stringify(raw);
    const clean = jsonStr.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    
    try {
      return JSON.parse(clean) as T;
    } catch (e) {
      console.log(`[repo-interview-prep] Standard JSON parse failed for ${fallbackName}, attempting jsonrepair...`);
      const repaired = jsonrepair(clean);
      return JSON.parse(repaired) as T;
    }
  } catch (err) {
    throw new Error(`Failed to parse ${fallbackName} as JSON, even after repair.`);
  }
}

export async function generatePrepBrief(
  github_repo_url: string,
  target_role: string,
  jd_text: string
): Promise<{ success: boolean; data?: RepoAnalysis; error?: string }> {
  try {
    if (!process.env.LAMATIC_FLOW_ID) {
      throw new Error(
        "LAMATIC_FLOW_ID environment variable is not set. Please add it to your .env.local file."
      );
    }

    const flows = config.flows;
    const flow = flows.step1;

    if (!flow.workflowId) {
      throw new Error("Workflow ID not found in config.");
    }

    const inputs = {
      github_repo_url,
      target_role: target_role || "",
      jd_text: jd_text || "",
      github_token: "",
    };

    console.log("[repo-interview-prep] Executing flow:", flow.workflowId);
    let resData = await lamaticClient.executeFlow(flow.workflowId, inputs);
    console.log("[repo-interview-prep] Response status:", resData?.status);

    if (resData?.status === "error") {
      throw new Error(`Lamatic workflow error: ${resData?.message}`);
    }

    // Handle async polling if needed
    if (resData?.result?.requestId && !resData?.result?.prep_brief) {
      const requestId = resData.result.requestId;
      console.log("[repo-interview-prep] Polling async result:", requestId);
      resData = await lamaticClient.checkStatus(requestId, 2, 120); // extended timeout to 120s for 4 sequential LLMs
      if (resData?.status === "error") {
        throw new Error(`Async execution failed: ${resData?.message}`);
      }
    }

    // Prefer result.output (wrapper case) before result (flat case)
    const resObj =
      resData?.result?.output ||
      resData?.result ||
      (resData as any)?.data?.output?.result;
    
    if (!resObj) {
      throw new Error("No result found in response payload.");
    }

    // Parse all 4 sections
    const prep_brief = safeParse<PrepBrief>(resObj.prep_brief, "prep_brief");
    const architecture = safeParse<ArchitectureAnalysis>(resObj.architecture, "architecture");
    const grill_me = safeParse<{ questions: GrillQuestion[] }>(resObj.grill_me, "grill_me");
    const production = safeParse<ProductionReadiness>(resObj.production, "production");

    // Lightweight field-presence validation — catch completely empty/wrong shapes early
    if (!prep_brief.project_summary || !Array.isArray(prep_brief.tech_stack)) {
      throw new Error("prep_brief is missing required fields (project_summary or tech_stack). Check the LLM prompt or model.");
    }
    if (!Array.isArray(architecture.tradeoffs)) {
      throw new Error("architecture.tradeoffs is not an array. Check the architecture LLM node output.");
    }
    if (!Array.isArray(grill_me.questions)) {
      throw new Error("grill_me.questions is not an array. Check the grill LLM node output.");
    }
    if (typeof production.is_production_ready !== "boolean" || !Array.isArray(production.critical_missing_features)) {
      throw new Error("production section has invalid shape. Check the production LLM node output.");
    }

    return { 
      success: true, 
      data: {
        prep_brief,
        architecture,
        grill_me,
        production
      }
    };
  } catch (error) {
    console.error("[repo-interview-prep] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}
