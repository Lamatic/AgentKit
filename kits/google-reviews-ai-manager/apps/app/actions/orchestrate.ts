"use server";
import { Lamatic } from "lamatic";

export async function generateReply(reviewText: string, starRating: string) {
  const apiKey = process.env.LAMATIC_API_KEY;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const flowId = process.env.LAMATIC_FLOW_ID;
  const apiUrl = process.env.LAMATIC_API_URL || "https://toufiqsorganization806-toufiqsproject110.lamatic.dev/graphql";
  
  if (!apiKey || !projectId || !flowId) {
    return { error: "Missing API Key, Project ID, or Flow ID in .env.local" };
  }

  try {
    const gqlQuery = `
      query ExecuteWorkflow(
        $workflowId: String!
        $reviewText: String
        $starRating: String        
      ) {
        executeWorkflow(
          workflowId: $workflowId
          payload: {
            reviewText: $reviewText
            starRating: $starRating
          }
        ) {
            status
            result
        }
      }`;

    const variables = {
      workflowId: flowId,
      reviewText: reviewText,
      starRating: starRating
    };

    console.log("[Lamatic Orchestrate] Executing Flow with raw fetch:", flowId);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-project-id": projectId
      },
      body: JSON.stringify({
        query: gqlQuery,
        variables: variables
      })
    });

    const resText = await response.text();
    console.log("[Lamatic Orchestrate] Raw response text:", resText);
    
    let resData;
    try {
      resData = JSON.parse(resText);
    } catch (e) {
      return { error: "Failed to parse Lamatic response as JSON: " + resText.substring(0, 100) };
    }

    if (resData.errors) {
      return { error: `GraphQL Error: ${resData.errors[0]?.message}` };
    }
    
    const anyData = resData?.data?.executeWorkflow;
    
    if (anyData?.status === "error") {
      return { error: "Lamatic Workflow Error: " + JSON.stringify(anyData.result || "Unknown error") };
    }

    const answer = anyData?.result?.response || anyData?.result?.answer || anyData?.result?.generatedResponse || JSON.stringify(anyData, null, 2);
    return { reply: answer };
  } catch (e: any) {
    console.error("Lamatic API Call Failed:", e);
    return { error: `Lamatic API error: ${e.message}` };
  }
}
