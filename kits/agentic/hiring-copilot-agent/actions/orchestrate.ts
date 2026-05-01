"use server";

import { lamaticClient } from "@/lib/lamatic-client";

export async function generateContent(payload: {
  job_description: string;
  name: string;
  skills: string[];
  projects: string[];
  education: string;
  certificates: string[];
  experience_years: number;
}) {
  try {
    const workflowId = process.env.AGENTIC_GENERATE_CONTENT;
    if (!workflowId) {
      throw new Error("AGENTIC_GENERATE_CONTENT is not configured");
    }

    const finalPayload = {
      ...payload,
    };

    // console.log("[orchestrate] Sending payload:", finalPayload);

    const resData = await lamaticClient.executeFlow(workflowId, finalPayload);
    if (!resData || resData.status !== "success") {
      throw new Error(
        `Lamatic flow failed: ${resData?.status} - ${resData?.message || "unknown error"}`,
      );
    }
    // console.log("[orchestrate] Raw response:", resData);

    return {
      success: true,
      data: resData.result,
    };
  } catch (error: any) {
    console.error("[orchestrate] Error:", error);

    return {
      success: false,
      error: "Failed to evaluate candidate",
    };
  }
}
