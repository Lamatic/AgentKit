"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate.js";

export async function generateContent(payload: {
  job_description: string;
  name: string;
  skills: string[];
  projects: string[];
  education: string;
  certificates: string[];
  experience_years: number;
  experience_level: string;
}) {
  try {
    const flows = config.flows;
    const firstFlowKey = Object.keys(flows)[0];

    if (!firstFlowKey) {
      throw new Error("No workflows found in config");
    }

    const flow = flows[firstFlowKey as keyof typeof flows];

    if (!flow.workflowId) {
      throw new Error("Workflow ID missing");
    }

    const finalPayload = {
      ...payload,
    };

    // console.log("[orchestrate] Sending payload:", finalPayload);

    const resData = await lamaticClient.executeFlow(
      flow.workflowId,
      finalPayload,
    );

    // console.log("[orchestrate] Raw response:", resData);

    return {
      success: true,
      data: resData.result,
    };
  } catch (error: any) {
    console.error("[orchestrate] Error:", error);

    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}
