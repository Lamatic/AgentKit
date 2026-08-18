const repoUrl = {{triggerNode_1.output.github_repo_url}};
const clean = repoUrl.replace("https://github.com/", "").replace(/\/$/, "");

output.owner = clean.split("/")[0];
output.repo = clean.split("/")[1];
output.repo_page_url = "https://github.com/" + clean;
