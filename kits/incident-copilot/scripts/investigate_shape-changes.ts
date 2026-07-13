// Code node: Shape_Changes (investigate)
// Compacts the GitHub commits API response into a short, evidence-friendly summary
// the Diagnose node can reason over. Degrades gracefully: if the fetch failed, was
// skipped (no repo), or returned an unexpected shape, it returns an explicit
// "no data" marker rather than throwing — a missing signal is a finding, not a crash.

const hasRepo = {{codeNode_parse.output.hasRepo}};
const raw = {{apiNode_github.output}};

function summarise(commits) {
  // Keep the 10 most recent commits; one line each: short sha, date, first line of message.
  return commits.slice(0, 10).map((c) => {
    const sha = (c.sha || "").slice(0, 7);
    const when = c.commit?.author?.date || c.commit?.committer?.date || "unknown-time";
    const msg = (c.commit?.message || "").split("\n")[0].slice(0, 120);
    const who = c.commit?.author?.name || "unknown";
    return `- ${sha} ${when} (${who}): ${msg}`;
  }).join("\n");
}

if (!hasRepo) {
  output = { recentChanges: "No repository was provided — reasoning from runbooks and the alert only." };
} else if (Array.isArray(raw) && raw.length > 0 && raw[0] && raw[0].sha) {
  output = { recentChanges: `Recent commits to the affected repo (most recent first):\n${summarise(raw)}` };
} else {
  // GitHub returns an object (not an array) on error, e.g. 404 private repo or 403 rate limit.
  const reason = raw && raw.message ? raw.message : "no commits returned";
  output = { recentChanges: `Recent-changes data unavailable (${reason}). Reasoning from runbooks and the alert only.` };
}
