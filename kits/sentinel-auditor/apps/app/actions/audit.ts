"use server";

import { Lamatic } from "lamatic";

export async function runModelAudit({ userPrompt, modelResponse }: { userPrompt: string, modelResponse: string }) {
  const apiKey = process.env.LAMATIC_API_KEY;
  const workflowId = process.env.LAMATIC_WORKFLOW_ID;
  const projectId = process.env.LAMATIC_PROJECT_ID; 
  const endpoint = process.env.LAMATIC_ENDPOINT_URL;

  if (!apiKey || !workflowId || !projectId || !endpoint) {
    throw new Error("Missing Lamatic configuration environment variables in .env.local");
  }

  // 1. Fixed constructor: Now includes the required endpoint
  const client = new Lamatic({
    apiKey: apiKey,
    projectId: projectId,
    endpoint: endpoint 
  });

  try {
    // 2. Fixed signature: Two positional arguments instead of one object
    const response = await client.executeFlow(workflowId, {
      user_prompt: userPrompt,
      model_response: modelResponse
    });
    
    return response;
  } catch (error: any) {
    console.error("Lamatic API Execution Failed:", error);
    throw new Error(error.message || "Failed to execute model audit flow.");
  }
}