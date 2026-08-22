"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate";
import type { PrepBrief, ArchitectureAnalysis, GrillQuestion, ProductionReadiness, RepoAnalysis } from "@/lib/types";
import { z } from "zod";

// Helper to coerce LLM arrays-of-objects back into arrays-of-strings
const robustStringArray = z.preprocess((val: any) => {
  if (Array.isArray(val)) {
    return val.map((item: any) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        const vals = Object.values(item);
        if (vals.length > 0 && typeof vals[0] === "string") return vals[0];
        return JSON.stringify(item);
      }
      return String(item);
    });
  }
  return val;
}, z.array(z.string()));

const RepoAnalysisSchema = z.object({
  prep_brief: z.object({
    project_summary: z.string(),
    tech_stack: robustStringArray,
    complexity_level: z.enum(["junior", "mid", "senior"]).catch("mid"),
    pitch: z.string(),
    follow_up_questions: z.array(
      z.object({
        question: z.string(),
        why_they_ask: z.string(),
        suggested_answer: z.string()
      })
    ),
    concepts_to_review: z.array(
      z.object({
        concept: z.string(),
        why_relevant: z.string(),
        depth_needed: z.enum(["surface", "moderate", "deep"]).catch("moderate")
      })
    ),
    red_flags: z.array(
      z.object({
        observation: z.string(),
        how_to_address: z.string()
      })
    ).optional().default([]),
    strengths_to_highlight: robustStringArray
  }),
  architecture: z.object({
    mermaid_diagram: z.string(),
    flow_summary: z.string(),
    tradeoffs: robustStringArray
  }),
  grill_me: z.object({
    questions: z.array(
      z.object({
        question: z.string(),
        defensive_strategy: z.string()
      })
    )
  }),
  production: z.object({
    is_production_ready: z.boolean(),
    critical_missing_features: robustStringArray,
    quick_wins: robustStringArray
  })
});

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

    // Helper to unwrap if the LLM nested the response (e.g. {"architecture": { ... }})
    function unwrap(obj: any, key: string) {
      if (obj && typeof obj === "object" && obj[key] && Object.keys(obj).length === 1) {
        return obj[key];
      }
      return obj;
    }

    // Parse all 4 sections
    const prep_brief = unwrap(safeParse<any>(resObj.prep_brief, "prep_brief"), "prep_brief");
    const architecture = unwrap(safeParse<any>(resObj.architecture, "architecture"), "architecture");
    const grill_me = unwrap(safeParse<any>(resObj.grill_me, "grill_me"), "grill_me");
    const production = unwrap(safeParse<any>(resObj.production, "production"), "production");

    console.log("[repo-interview-prep] Parsed architecture shape:", JSON.stringify(architecture).substring(0, 200));

    // Complete schema validation before returning success
    const parsedData = RepoAnalysisSchema.parse({
      prep_brief,
      architecture,
      grill_me,
      production
    });

    return { 
      success: true, 
      data: parsedData as RepoAnalysis
    };
  } catch (error) {
    console.error("[repo-interview-prep] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}
