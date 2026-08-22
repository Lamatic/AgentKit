const repoUrl = {{triggerNode_1.output.github_repo_url}};

// Strip the GitHub origin so we're left with just the path
const withoutOrigin = repoUrl
  .replace(/^https?:\/\/github\.com\//, "")
  .replace(/\/$/, "");

// Split and validate: exactly owner + repo, no extra segments
const parts = withoutOrigin.split("/");
if (parts.length !== 2) {
  throw new Error(
    "Invalid GitHub repository URL. Expected exactly two path segments: https://github.com/owner/repo"
  );
}

const [owner, repo] = parts;

// Reject empty or obviously malformed slugs (GitHub slugs are alphanumeric + hyphens)
const slugPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
if (!owner || !slugPattern.test(owner)) {
  throw new Error("Invalid GitHub owner slug: \"" + owner + "\". Must be alphanumeric with hyphens/dots.");
}
if (!repo || !slugPattern.test(repo)) {
  throw new Error("Invalid GitHub repository slug: \"" + repo + "\". Must be alphanumeric with hyphens/dots.");
}

output.owner = owner;
output.repo = repo;
output.repo_page_url = "https://github.com/" + owner + "/" + repo;
