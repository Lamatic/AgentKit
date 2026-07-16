"use server";

import { Lamatic } from "lamatic";

export async function runModelAudit({ userPrompt, modelResponse }: { userPrompt: string, modelResponse: string }) {
  const apiKey = process.env.LAMATIC_API_KEY;
  const workflowId = process.env.LAMATIC_WORKFLOW_ID;
  const projectId = process.env.LAMATIC_PROJECT_ID; // Secured from env

  if (!apiKey || !workflowId || !projectId) {
    throw new Error("Missing Lamatic configuration environment variables in .env.local");
  }

  // Initialize official Lamatic SDK
  const client = new Lamatic({
    apiKey: apiKey,
    projectId: projectId,
  });

  try {
    const response = await client.executeWorkflow({
      workflowId: workflowId,
      payload: {
        user_prompt: userPrompt,
        model_response: modelResponse
      }
    });
    
    return response;
  } catch (error: any) {
    console.error("Lamatic API Execution Failed:", error);
    throw new Error(error.message || "Failed to execute model audit flow.");
  }
}