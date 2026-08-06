// Code node: Parse_Repo (investigate)
// Turns the optional repo URL into GitHub API parameters. Runs before the GitHub
// fetch. If no repo URL is provided, signals downstream to skip the fetch so the
// investigation can proceed on runbooks alone.

const url = ({{triggerNode_1.output.repoUrl}} || "").trim();
const token = ({{triggerNode_1.output.githubToken}} || "").trim();

const headers = {
  "Accept": "application/vnd.github+json",
  "User-Agent": "incident-copilot"
};
if (token) headers["Authorization"] = `Bearer ${token}`;

const match = url.match(/github\.com\/([^\/]+)\/([^\/#?]+)/);
if (!match) {
  // No usable repo — downstream fetch is skipped; recentChanges stays empty.
  output = { hasRepo: false, owner: "", repo: "", headers: JSON.stringify(headers) };
} else {
  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");
  output = { hasRepo: true, owner, repo, headers: JSON.stringify(headers) };
}
