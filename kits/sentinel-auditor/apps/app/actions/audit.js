"use server";

import axios from "axios";

export async function runModelAudit({ userPrompt, modelResponse }) {
  const apiKey = process.env.LAMATIC_API_KEY;
  const url = process.env.LAMATIC_ENDPOINT_URL;
  const workflowId = process.env.LAMATIC_WORKFLOW_ID;

  if (!apiKey || !url || !workflowId) {
    throw new Error("Missing Lamatic configuration environment variables in .env.local");
  }

  const query = `
    query ExecuteWorkflow(
      $workflowId: String!
      $user_prompt: String
      $model_response: String        
    ) {
      executeWorkflow(
        workflowId: $workflowId
        payload: {
          user_prompt: $user_prompt
          model_response: $model_response
        }
      ) {
          status
          result
      }
    }`;

  const variables = {
    workflowId,
    user_prompt: userPrompt,
    model_response: modelResponse
  };

  try {
    const response = await axios({
      method: "POST",
      url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-project-id": "edb0d31c-5f7b-44cb-b91d-e0c110acf758",
      },
      data: { query, variables },
    });

    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      throw new Error(response.data.errors[0]?.message || "GraphQL Execution Error");
    }

    return response.data.data.executeWorkflow;
  } catch (error) {
    console.error("Lamatic API Execution Failed:", error?.response?.data || error.message);
    throw new Error(error?.response?.data?.errors?.[0]?.message || "Failed to execute model audit flow.");
  }
}