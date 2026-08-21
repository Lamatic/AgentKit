const GITHUB_API = "https://api.github.com";

// Diffs can be huge; caps keep the LLM input focused and within token limits.
const PATCH_CHARS_PER_FILE = 1200;
const MAX_FILES_PER_COMMIT = 20;
const MAX_TOTAL_CHARS = 24000;

export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface CommitFileChange {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface CommitDetail extends CommitSummary {
  files: CommitFileChange[];
}

/** Builds GitHub API headers, attaching the PAT from GITHUB_TOKEN when set. */
function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/** GETs a GitHub REST path and returns parsed JSON, mapping common errors to actionable messages. */
async function githubFetch(path: string): Promise<any> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const hint =
      res.status === 404
        ? "Repo not found — check owner/repo, or set GITHUB_TOKEN for private repos."
        : res.status === 403
          ? "Rate limited or forbidden — set GITHUB_TOKEN in .env.local."
          : res.statusText;
    throw new Error(`GitHub API ${res.status}: ${hint}`);
  }
  return res.json();
}

/** Lists commits on a branch within the last `days`, newest first (max 25). */
export async function fetchRecentCommits(
  owner: string,
  repo: string,
  branch: string,
  days: number
): Promise<CommitSummary[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const data = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(branch)}&since=${since}&per_page=25`
  );
  return data.map((c: any) => ({
    sha: c.sha,
    message: c.commit?.message ?? "",
    author: c.commit?.author?.name ?? c.author?.login ?? "unknown",
    date: c.commit?.author?.date ?? "",
  }));
}

/** Fetches one commit with its per-file diff patches. */
export async function fetchCommitDetail(owner: string, repo: string, sha: string): Promise<CommitDetail> {
  const data = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`
  );
  return {
    sha: data.sha,
    message: data.commit?.message ?? "",
    author: data.commit?.author?.name ?? "unknown",
    date: data.commit?.author?.date ?? "",
    files: (data.files ?? []).map((f: any) => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    })),
  };
}

/** Formats commits + truncated diffs into the plain-text block the devdiary-log flow expects. */
export function buildCommitText(commits: CommitDetail[]): string {
  const blocks: string[] = [];
  let total = 0;

  for (const commit of commits) {
    const lines: string[] = [];
    lines.push(`Commit ${commit.sha.slice(0, 7)}: ${commit.message.split("\n")[0]}`);
    lines.push("--- Files changed ---");

    for (const file of commit.files.slice(0, MAX_FILES_PER_COMMIT)) {
      let entry = `${file.filename} (+${file.additions} -${file.deletions})`;
      if (file.patch) {
        entry += `:\n${file.patch.slice(0, PATCH_CHARS_PER_FILE)}`;
      }
      lines.push(entry);
    }
    if (commit.files.length > MAX_FILES_PER_COMMIT) {
      lines.push(`(+${commit.files.length - MAX_FILES_PER_COMMIT} more files)`);
    }

    const block = lines.join("\n");
    if (blocks.length === 0) {
      blocks.push(block.slice(0, MAX_TOTAL_CHARS));
      total += Math.min(block.length, MAX_TOTAL_CHARS);
      continue;
    }
    if (total + block.length > MAX_TOTAL_CHARS) break;
    total += block.length;
    blocks.push(block);
  }

  return blocks.join("\n\n");
}
