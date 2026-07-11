"use server";

import { getLamaticClient, getFlowIds } from "@/lib/lamatic-client";
import { fetchRecentCommits, fetchCommitDetail, buildCommitText } from "@/lib/github";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function toError(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

export async function syncRepo(
  owner: string,
  repo: string,
  branch: string,
  days: number,
  project?: string
): Promise<ActionResult<{ entry: string; commitCount: number }>> {
  try {
    if (!owner.trim() || !repo.trim()) {
      return { success: false, error: "Owner and repo are required." };
    }

    const commits = await fetchRecentCommits(owner, repo, branch || "main", days);
    if (commits.length === 0) {
      return { success: false, error: `No commits found on ${branch} in the last ${days} day(s).` };
    }

    const details = await Promise.all(
      commits.slice(0, 10).map((c) => fetchCommitDetail(owner, repo, c.sha))
    );
    const commitText = buildCommitText(details);

    const client = getLamaticClient();
    const response = await client.executeFlow(getFlowIds().log, {
      project: project?.trim() || repo,
      repo: `${owner}/${repo}`,
      branch: branch || "main",
      author: details[0]?.author ?? "unknown",
      date: new Date().toISOString(),
      commitText,
    });

    const entry = response?.result?.entry;
    if (!entry) throw new Error("Flow returned no entry. Check flow deployment and IDs.");

    return { success: true, data: { entry, commitCount: details.length } };
  } catch (err) {
    return { success: false, error: toError(err) };
  }
}

export async function askDiary(query: string): Promise<ActionResult<{ answer: string }>> {
  try {
    if (!query.trim()) {
      return { success: false, error: "Question is empty." };
    }

    const client = getLamaticClient();
    const response = await client.executeFlow(getFlowIds().ask, { query });

    const answer = response?.result?.answer;
    if (!answer) throw new Error("Flow returned no answer. Check flow deployment and IDs.");

    return { success: true, data: { answer } };
  } catch (err) {
    return { success: false, error: toError(err) };
  }
}
