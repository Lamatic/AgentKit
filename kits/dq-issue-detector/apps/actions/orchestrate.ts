"use server";

import { lamaticClient } from "../lib/lamatic-client"
import lamaticConfig from "../../lamatic.config"

export async function orchestrateAnalysis(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("File is required");

    const fileContent = await file.text();

    const step = lamaticConfig.steps.find((s) => s.id === "data-quality-agent") as any;
    let workflowId = step?.workflowId || (step?.envKey ? process.env[step.envKey] : undefined);
    if (!workflowId) {
      workflowId = process.env.DATA_QUALITY_AGENT;
    }
    if (!workflowId) {
      throw new Error("Data Quality Agent workflow ID is not configured. Please define it in lamatic.config.ts or the DATA_QUALITY_AGENT env variable.");
    }

    const query = `
      query ExecuteWorkflow($workflowId: String!, $file: JSON) {
        executeWorkflow(
          workflowId: $workflowId
          payload: { file: $file }
        ) {
          status
          result
        }
      }`;

    const variables = {
      workflowId,
      file: {
        name: file.name,
        content: fileContent
      }
    };

    const response = await lamaticClient.executeGraphQL(query, variables);

    let report = response.result;
    if (typeof report === "object" && report !== null) {
      report = report.report || JSON.stringify(report, null, 2);
    }

    return { success: true, data: report };

  } catch (error: unknown) {
    console.error("Data Quality Analysis Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}