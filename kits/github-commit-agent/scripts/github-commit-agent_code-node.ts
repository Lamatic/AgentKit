// Script: Fetch Commits from GitHub API
// Flow: github-commit-agent
// Node: Fetch Commits from GitHub (codeNode_100)
//
// Reads structured intent extracted by the parse-intent LLM node (LLMNode_parse_50).
// base_ref and head_ref are OPTIONAL — auto-detected from GitHub if blank.
//
// Input (from parse-intent LLM):
//   LLMNode_parse_50.output.generatedResponse — JSON string with:
//     repo     : GitHub repo in "owner/repo" format (REQUIRED)
//     base_ref : Older tag / branch / SHA (OPTIONAL)
//     head_ref : Newer tag / branch / SHA (OPTIONAL)
//
// Auto-detection logic:
//   - Both blank     → fetches latest 2 tags, diffs them
//   - Only head blank → uses repo default branch as head
//   - Only base blank → uses latest tag as base
//
// Output:
//   { commits: string[], resolvedBase: string, resolvedHead: string }

// ── Parse the JSON output from the intent LLM ────────────────────────────────
const rawIntent = `{{LLMNode_parse_50.output.generatedResponse}}`.trim();
let parsed: { repo?: string; base_ref?: string; head_ref?: string } = {};

try {
  parsed = JSON.parse(rawIntent);
} catch (e) {
  throw new Error(
    `Could not parse intent from your message. Model returned: ${rawIntent}. ` +
    `Try rephrasing, e.g. "What changed in Lamatic/AgentKit since v1.0.0?"`
  );
}

let repo = (parsed.repo || "").trim();
// Extract owner/repo from full github URLs if returned
if (repo.includes("github.com/")) {
  repo = repo.split("github.com/")[1].split("?")[0].split("#")[0];
}
repo = repo.replace(/\/+$/, ""); // remove trailing slashes

let baseRef = (parsed.base_ref || "").trim();
let headRef = (parsed.head_ref || "").trim();

if (!repo) {
  throw new Error(
    "Could not identify a GitHub repository from your message. " +
    "Please include the repo in owner/repo format (e.g. 'Lamatic/AgentKit') or paste the repository URL."
  );
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

const headers: Record<string, string> = {
  "Accept": "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28"
};

if (GITHUB_TOKEN) {
  headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
}

// ── Auto-detect refs if not provided ─────────────────────────────────────────

async function fetchLatestTags(n: number): Promise<string[]> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/tags?per_page=${n}`,
    { headers }
  );
  if (!res.ok) throw new Error(`Could not fetch tags: ${res.status}`);
  const tags = await res.json();
  return tags.map((t: any) => t.name as string);
}

async function fetchDefaultBranch(): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) throw new Error(`Could not fetch repo info: ${res.status}`);
  const info = await res.json();
  return info.default_branch || "main";
}

if (!baseRef && !headRef) {
  // Auto-detect: try to diff the two most recent tags
  let tags: string[] = [];
  try {
    tags = await fetchLatestTags(2);
  } catch (e) {
    // Ignore and proceed to branch fallback
  }

  if (tags.length >= 2) {
    // GitHub returns tags newest-first: tags[0] = latest, tags[1] = second-latest
    headRef = tags[0];
    baseRef = tags[1];
  } else {
    // Fallback for repositories without tags: fetch latest 15 commits of default branch
    const defaultBranch = await fetchDefaultBranch();
    const commitsUrl = `https://api.github.com/repos/${repo}/commits?sha=${defaultBranch}&per_page=15`;
    const commitsRes = await fetch(commitsUrl, { headers });
    if (!commitsRes.ok) {
      throw new Error(`Auto-detection failed: No tags found, and default branch "${defaultBranch}" commits could not be fetched.`);
    }
    const commitsData = await commitsRes.json();
    const commitsList = (commitsData || [])
      .map((c: any) => (c.commit?.message || "").split("\n")[0].trim())
      .filter((msg: string) => msg.length > 0);

    if (commitsList.length === 0) {
      throw new Error(`No commits found on branch "${defaultBranch}".`);
    }

    return {
      commits: commitsList,
      resolvedBase: "initial",
      resolvedHead: defaultBranch
    };
  }

} else if (!baseRef && headRef) {
  // head provided but not base → try to use latest tag as base
  let tags: string[] = [];
  try {
    tags = await fetchLatestTags(1);
  } catch (e) {
    // Ignore and proceed to branch fallback
  }

  if (tags.length > 0) {
    baseRef = tags[0];
  } else {
    // If no tags, compare headRef (e.g. staging) to default branch, or fetch latest commits
    const defaultBranch = await fetchDefaultBranch();
    if (headRef !== defaultBranch) {
      baseRef = defaultBranch;
    } else {
      const commitsUrl = `https://api.github.com/repos/${repo}/commits?sha=${headRef}&per_page=15`;
      const commitsRes = await fetch(commitsUrl, { headers });
      if (!commitsRes.ok) throw new Error(`Could not fetch commits for branch: ${headRef}`);
      const commitsData = await commitsRes.json();
      const commitsList = (commitsData || [])
        .map((c: any) => (c.commit?.message || "").split("\n")[0].trim())
        .filter((msg: string) => msg.length > 0);
      return {
        commits: commitsList,
        resolvedBase: "initial",
        resolvedHead: headRef
      };
    }
  }

} else if (baseRef && !headRef) {
  // base provided but not head → use the default branch (e.g. main)
  headRef = await fetchDefaultBranch();
}

// ── Fetch commits between the two resolved refs ───────────────────────────────

const compareUrl = `https://api.github.com/repos/${repo}/compare/${baseRef}...${headRef}`;
const compareRes = await fetch(compareUrl, { headers });

if (!compareRes.ok) {
  const body = await compareRes.text();
  throw new Error(
    `GitHub API error ${compareRes.status} when comparing ` +
    `${baseRef}...${headRef} in ${repo}: ${body}`
  );
}

const data = await compareRes.json();

const commits: string[] = (data.commits || [])
  .map((c: any) => (c.commit?.message || "").split("\n")[0].trim())
  .filter((msg: string) => msg.length > 0);

if (commits.length === 0) {
  throw new Error(
    `No commits found between "${baseRef}" and "${headRef}" in ${repo}. ` +
    `Verify that the refs differ and commits exist in that range.`
  );
}

return {
  commits,
  resolvedBase: baseRef,
  resolvedHead: headRef
};
