import { GitHubRepo } from "@/lib/types";

interface FetchReposOptions {
  accessToken: string;
  page?: number;
  perPage?: number;
  sort?: "updated" | "created" | "pushed" | "full_name";
}

export interface FetchReposResult {
  repositories: GitHubRepo[];
  hasMore: boolean;
  page: number;
}

/**
 * Server-side service to fetch user repositories from GitHub REST API
 */
export async function fetchUserRepositories(
  options: FetchReposOptions
): Promise<FetchReposResult | { error: string; status: number }> {
  const { accessToken, page = 1, perPage = 30, sort = "updated" } = options;

  const url = new URL("https://api.github.com/user/repos");
  url.searchParams.set("sort", sort);
  url.searchParams.set("direction", "desc");
  url.searchParams.set("per_page", perPage.toString());
  url.searchParams.set("page", page.toString());
  url.searchParams.set("affiliation", "owner,collaborate,organization_member");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "AgentKit-CICD-Diagnoser",
      },
      next: { revalidate: 60 }, // 60s cache
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { error: "GitHub token expired or unauthorized.", status: 401 };
      }
      if (response.status === 403) {
        return { error: "GitHub API rate limit exceeded. Please try again later.", status: 403 };
      }
      return { error: `GitHub API error: ${response.statusText}`, status: response.status };
    }

    const rawRepos = await response.json();

    // Guard: GitHub should return an array; if not, return a structured error
    if (!Array.isArray(rawRepos)) {
      console.error("[repos] Unexpected GitHub response shape:", rawRepos);
      return { error: "Unexpected response from GitHub API. Please try again.", status: 502 };
    }

    // Map GitHub API output to sanitized GitHubRepo interface
    const repositories: GitHubRepo[] = rawRepos.map((item: any) => ({
      id: item.id,
      name: item.name,
      fullName: item.full_name,
      owner: {
        login: item.owner?.login || "unknown",
        avatarUrl: item.owner?.avatar_url || "",
      },
      isPrivate: Boolean(item.private),
      description: item.description || null,
      language: item.language || null,
      defaultBranch: item.default_branch || "main",
      stargazersCount: item.stargazers_count || 0,
      updatedAt: item.updated_at || new Date().toISOString(),
      htmlUrl: item.html_url || `https://github.com/${item.full_name}`,
    }));

    // Check pagination link header to see if more pages exist
    const linkHeader = response.headers.get("link");
    const hasMore = Boolean(linkHeader && linkHeader.includes('rel="next"')) || repositories.length === perPage;

    return {
      repositories,
      hasMore,
      page,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network failure reaching GitHub API";
    return { error: message, status: 500 };
  }
}
