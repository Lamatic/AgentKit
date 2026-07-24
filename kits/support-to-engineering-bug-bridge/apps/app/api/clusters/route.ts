import { NextResponse } from "next/server";
import { lamaticClient } from "@/lib/lamatic-client";
import { parseCluster } from "@/lib/types";

export const dynamic = 'force-dynamic';

export async function GET() {
  const endpoint = process.env.LAMATIC_API_URL?.trim() || "https://api.lamatic.ai/v1";
  const apiKey = process.env.LAMATIC_API_KEY?.trim() || "";
  const projectId = process.env.LAMATIC_PROJECT_ID?.trim() || "";
  const workflowId = process.env.BUG_BRIDGE_LIST_FLOW_ID?.trim() || "";

  if (!workflowId) {
    return NextResponse.json(
      {
        clusters: [],
        error:
          "BUG_BRIDGE_LIST_FLOW_ID is not set. Create the bug-bridge-list-flow " +
          "in Lamatic Studio and add its ID to .env.local.",
      },
      { status: 200 } // 200 so the dashboard renders with an error banner rather than crashing
    );
  }

  try {
    const graphqlQuery = `
query ExecuteWorkflow($workflowId: String!, $sampleInput: String) {
  executeWorkflow(
    workflowId: $workflowId
    payload: { sampleInput: $sampleInput }
  ) {
    status
    result
  }
}
    `;

    const checkStatusQuery = `
query CheckStatus($requestId: String!) {
  checkStatus(requestId: $requestId)
}
    `;

    const fetchResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-project-id": projectId
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          workflowId: workflowId,
          sampleInput: "sampleInput"
        }
      })
    });

    if (!fetchResponse.ok) {
      throw new Error(`Lamatic HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
    }

    const json = await fetchResponse.json();

    if (json.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`);
    }

    const executeWorkflowData = json.data?.executeWorkflow;
    
    if (!executeWorkflowData || typeof executeWorkflowData !== 'object') {
       throw new Error(`Unexpected GraphQL response shape: missing data.executeWorkflow. Received: ${JSON.stringify(json)}`);
    }

    const requestId = executeWorkflowData.result?.requestId;
    if (!requestId) {
      throw new Error(`No requestId returned. Received: ${JSON.stringify(executeWorkflowData)}`);
    }

    let rawClusters: Record<string, any>[] = [];
    let pollAttempts = 0;
    const maxAttempts = 8; // 8 attempts * 1 second = 8s max to avoid Next.js function timeout
    const delayMs = 1000;

    while (pollAttempts < maxAttempts) {
      pollAttempts++;
      await new Promise(res => setTimeout(res, delayMs));

      const statusResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "x-project-id": projectId
        },
        body: JSON.stringify({
          query: checkStatusQuery,
          variables: { requestId }
        })
      });

      if (!statusResponse.ok) {
        throw new Error(`Lamatic CheckStatus HTTP ${statusResponse.status}`);
      }

      const statusJson = await statusResponse.json();
      if (statusJson.errors) {
        throw new Error(`GraphQL Status Error: ${JSON.stringify(statusJson.errors)}`);
      }

      const statusResult = statusJson.data?.checkStatus;
      if (!statusResult) {
        throw new Error(`Unexpected CheckStatus response: ${JSON.stringify(statusJson)}`);
      }

      if (statusResult.status === "success") {
        // The completed flow output is actually nested under data.output
        const flowOutput = statusResult.data?.output || {};
        const returnedClusters = flowOutput.clusters ?? flowOutput.result?.clusters;
        
        console.log("[api/clusters] CheckStatus successful. Raw returnedClusters type:", typeof returnedClusters, "value:", typeof returnedClusters === "string" ? returnedClusters : "(see type)");

        if (typeof returnedClusters === "string") {
          try {
            rawClusters = JSON.parse(returnedClusters);
          } catch (e) {
            console.error("[api/clusters] Failed to parse returnedClusters string");
            rawClusters = [];
          }
        } else if (Array.isArray(returnedClusters)) {
          rawClusters = returnedClusters;
        } else {
          console.error("[api/clusters] Unexpected clusters shape:", typeof returnedClusters);
          rawClusters = [];
        }
        
        break;
      } else if (statusResult.status === "error" || statusResult.status === "failed") {
        throw new Error(`Workflow Failed: ${statusResult.message || JSON.stringify(statusResult)}`);
      }
    }

    if (pollAttempts >= maxAttempts && rawClusters.length === 0) {
      throw new Error("Timeout waiting for Lamatic workflow to complete.");
    }

    const clusters = rawClusters.map(parseCluster);

    // Sort: P1 first, then by account count descending, then by last_updated descending
    clusters.sort((a, b) => {
      const severity: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
      const sevA = severity[a.severity] ?? 99;
      const sevB = severity[b.severity] ?? 99;
      const sevDiff = sevA - sevB;
      if (sevDiff !== 0) return sevDiff;
      const countDiff = b.account_count - a.account_count;
      if (countDiff !== 0) return countDiff;
      return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
    });

    return NextResponse.json({ clusters });
  } catch (error: any) {
    console.error("[api/clusters] fetch failed:", error);
    return NextResponse.json(
      {
        clusters: [],
        error: "Fetch Error: " + (error.message || String(error)),
      },
      { status: 200 } // 200 so the dashboard renders with an error banner, not a crash page
    );
  }
}
