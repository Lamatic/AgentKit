import { GitHubWorkflow, GitHubWorkflowRun } from "@/lib/types";

interface FetchRunsOptions {
  accessToken: string;
  owner: string;
  repo: string;
  workflowId?: string;
  status?: string;
  branch?: string;
  event?: string;
  page?: number;
  perPage?: number;
}

/**
 * Fetch GitHub Actions Workflows for a repository
 */
export async function fetchRepositoryWorkflows(
  accessToken: string,
  owner: string,
  repo: string
): Promise<{ workflows: GitHubWorkflow[] } | { error: string; status: number }> {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "AgentKit-CICD-Diagnoser",
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { error: "Repository not found or GitHub Actions is disabled.", status: 404 };
      }
      return { error: `GitHub API error: ${response.statusText}`, status: response.status };
    }

    const data = await response.json();
    const rawWorkflows = data.workflows || [];

    const workflows: GitHubWorkflow[] = rawWorkflows.map((item: any) => ({
      id: item.id,
      name: item.name,
      path: item.path,
      state: item.state,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      url: item.url,
      htmlUrl: item.html_url,
      badgeUrl: item.badge_url,
    }));

    return { workflows };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error fetching workflows";
    return { error: message, status: 500 };
  }
}

/**
 * Fetch GitHub Actions Workflow Runs for a repository
 */
export async function fetchRepositoryWorkflowRuns(
  options: FetchRunsOptions
): Promise<{ runs: GitHubWorkflowRun[]; totalCount: number } | { error: string; status: number }> {
  const { accessToken, owner, repo, workflowId, status, branch, event, page = 1, perPage = 30 } = options;

  let urlStr = `https://api.github.com/repos/${owner}/${repo}/actions/runs`;
  if (workflowId && workflowId !== "all") {
    urlStr = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`;
  }

  const url = new URL(urlStr);
  url.searchParams.set("per_page", perPage.toString());
  url.searchParams.set("page", page.toString());
  if (status && status !== "all") url.searchParams.set("status", status);
  if (branch) url.searchParams.set("branch", branch);
  if (event) url.searchParams.set("event", event);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "AgentKit-CICD-Diagnoser",
      },
      next: { revalidate: 15 },
    });

    if (!response.ok) {
      return { error: `GitHub API error: ${response.statusText}`, status: response.status };
    }

    const data = await response.json();
    const rawRuns = data.workflow_runs || [];

    const runs: GitHubWorkflowRun[] = rawRuns.map((item: any) => {
      const start = new Date(item.run_started_at || item.created_at).getTime();
      const end = new Date(item.updated_at).getTime();
      const durationSeconds = Math.max(0, Math.floor((end - start) / 1000));

      return {
        id: item.id,
        name: item.name || item.display_title || "Workflow Run",
        runNumber: item.run_number,
        event: item.event,
        status: item.status,
        conclusion: item.conclusion,
        workflowId: item.workflow_id,
        headBranch: item.head_branch || "main",
        headSha: item.head_sha ? item.head_sha.substring(0, 7) : "",
        headCommitMessage: item.head_commit?.message || item.display_title || "No commit message",
        actor: {
          login: item.actor?.login || "unknown",
          avatarUrl: item.actor?.avatar_url || "",
        },
        htmlUrl: item.html_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        durationSeconds,
      };
    });

    return { runs, totalCount: data.total_count || 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error fetching workflow runs";
    return { error: message, status: 500 };
  }
}
