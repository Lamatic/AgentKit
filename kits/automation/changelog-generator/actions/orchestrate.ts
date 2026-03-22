"use server";

import { Lamatic } from "lamatic";

const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_PROJECT_ENDPOINT!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  apiKey: process.env.LAMATIC_PROJECT_API_KEY!,
});

interface ChangelogInput {
  repoUrl: string;
  dateFrom: string;
  dateTo: string;
}

export async function generateChangelog({
  repoUrl,
  dateFrom,
  dateTo,
}: ChangelogInput): Promise<string> {
  const flowId = process.env.LAMATIC_FLOW_ID;
  if (!flowId) throw new Error("Missing LAMATIC_FLOW_ID");

  const response = await lamaticClient.executeFlow(flowId, {
    repo_url: repoUrl,
    date_from: dateFrom,
    date_to: dateTo,
  }) as any;

  // Handle async flow (returns requestId)
  if (response?.result?.requestId) {
    const finalResult = await lamaticClient.checkStatus(
      response.result.requestId,
      5,
      120
    ) as any;
    return response?.result?.changeLog ||
       response?.data?.output?.result?.changeLog ||
       response?.data?.changeLog ||
       JSON.stringify(response);
  }

  // Handle sync flow (returns result directly)
  return response?.result?.changeLog ||
       response?.data?.output?.result?.changeLog ||
       response?.data?.changeLog ||
       JSON.stringify(response);
}