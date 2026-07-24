import { z } from "zod";

const issueUrlSchema = z
  .string()
  .url()
  .regex(
    /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/issues\/([1-9][0-9]*)\/?$/,
    "Only public GitHub issue URLs are supported.",
  );

const issueResponseSchema = z.object({
  html_url: z.string().url(),
  title: z.string(),
  body: z.string().nullable().default(""),
  state: z.enum(["open", "closed"]),
  user: z.object({ login: z.string() }),
  labels: z.array(z.object({ name: z.string().nullable() })),
  pull_request: z.unknown().optional(),
});

type FetchLike = typeof fetch;

export class GitHubIssueReader {
  constructor(private readonly request: FetchLike = fetch) {}

  async read(issueUrl: string) {
    const normalizedUrl = issueUrlSchema.parse(issueUrl).replace(/\/$/, "");
    const match = normalizedUrl.match(
      /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/([0-9]+)$/,
    );
    if (!match) throw new Error("Only public GitHub issue URLs are supported.");

    const [, owner, repository, issueNumber] = match;
    const response = await this.request(
      `https://api.github.com/repos/${owner}/${repository}/issues/${issueNumber}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "isolate-agentkit",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "The GitHub issue is not public or does not exist."
          : `GitHub returned ${response.status} while reading the issue.`,
      );
    }

    const payload = await response.json();
    if (
      z.object({ pull_request: z.unknown().optional() }).parse(payload)
        .pull_request
    ) {
      throw new Error("Pull requests are not supported.");
    }
    const issue = issueResponseSchema.parse(payload);

    return {
      url: issue.html_url,
      repositoryUrl: `https://github.com/${owner}/${repository}`,
      owner,
      repository,
      number: Number(issueNumber),
      title: issue.title.slice(0, 500),
      body: (issue.body ?? "").slice(0, 20_000),
      state: issue.state,
      author: issue.user.login,
      labels: issue.labels.flatMap(({ name }) => (name ? [name] : [])).slice(0, 30),
    };
  }
}

export function createGitHubIssueReader() {
  return new GitHubIssueReader();
}
