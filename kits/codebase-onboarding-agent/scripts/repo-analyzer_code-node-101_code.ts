const url = {{triggerNode_1.output.repo_url}};
const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
if (!match) throw new Error("Invalid GitHub URL");
const owner = match[1];
const repo = match[2].replace(/\.git$/, "");
const token = {{triggerNode_1.output.github_token}} || "";

const headers = {
  "Accept": "application/vnd.github.v3+json",
  "User-Agent": "codebase-onboarding-agent"
};
if (token) headers["Authorization"] = `Bearer ${token}`;

output = { owner, repo, headers: JSON.stringify(headers) };
