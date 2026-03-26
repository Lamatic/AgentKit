"use server";

import { Lamatic } from "lamatic";

function createLamaticClient() {
  const endpoint = process.env.LAMATIC_PROJECT_ENDPOINT;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_PROJECT_API_KEY;
  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Missing Lamatic project configuration");
  }

  return new Lamatic({ endpoint, projectId, apiKey });
}

const lamaticClient = createLamaticClient();

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
  const parsedRepoUrl = new URL(repoUrl);
  const [owner, repo] = parsedRepoUrl.pathname.split("/").filter(Boolean);
  if (parsedRepoUrl.hostname !== "github.com" || !owner || !repo) {
    throw new Error("repoUrl must be a valid GitHub repository URL");
  }
  if (!dateFrom || !dateTo || dateFrom > dateTo) {
    throw new Error("Invalid date range");
  }
  const flowId = process.env.LAMATIC_FLOW_ID;
  if (!flowId) throw new Error("Missing LAMATIC_FLOW_ID");

  const response = await lamaticClient.executeFlow(flowId, {
    repo_url: repoUrl,
    date_from: dateFrom,
    date_to: dateTo,
  }) as any;

  const extractChangelog = (payload: any) =>
    payload?.result?.changeLog ??
    payload?.data?.output?.result?.changeLog ??
    payload?.data?.changeLog;

  // Handle async flow (returns requestId)
  if (response?.result?.requestId) {
    const finalResult = await lamaticClient.checkStatus(
      response.result.requestId,
      5,
      120
    ) as any;
    const changelog = extractChangelog(finalResult);
    if (!changelog) throw new Error("Failed to extract changelog from Lamatic response");
    return changelog;
  }

  // Handle sync flow (returns result directly)
  const changelog = extractChangelog(response);
  if (!changelog) throw new Error("Failed to extract changelog from Lamatic response");
  return changelog;
}