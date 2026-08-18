const repoUrl = {{triggerNode_1.output.github_repo_url}};
const clean = repoUrl.replace("https://github.com/", "").replace(/\/$/, "");
const parts = clean.split("/");

if (parts.length !== 2 || !parts[0] || !parts[1]) {
  throw new Error("Invalid GitHub repository URL. Expected format: https://github.com/owner/repo");
}

output.owner = parts[0];
output.repo = parts[1];
output.repo_page_url = "https://github.com/" + parts[0] + "/" + parts[1];
