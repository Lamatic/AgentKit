// WARNING: This severity rubric is duplicated in the flow's Code Nodes (specifically bug-bridge-flow_code-node-776_code.ts).
// Any changes to severity thresholds must be kept in sync manually across both locations to prevent drift.
export function calculateSeverityFromCount(count: number): "P1" | "P2" | "P3" | "P4" {
  if (count >= 7) return "P1";
  if (count >= 4) return "P2";
  if (count >= 2) return "P3";
  return "P4";
}

export type ClusterSummary = {
  cluster_id: string;
  severity: "P1" | "P2" | "P3" | "P4";
  account_count: number;
  ticket_count: number;
  ticket_ids: string[];
  gh_issue_number: number | null;
  gh_issue_url: string | null;
  last_updated: string;
};

/**
 * Parses the raw cluster metadata returned by the Lamatic list flow
 * into the ClusterSummary shape the dashboard consumes.
 */
export function parseCluster(raw: Record<string, any>): ClusterSummary {
  const parseArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          return JSON.parse(trimmed).map(String);
        } catch (e) {
          console.warn("[parseCluster] Failed to parse JSON array string:", val);
        }
      }
      return trimmed.split(",").map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  };

  const accounts: string[] = parseArray(raw.accounts);
  const ticketIds: string[] = parseArray(raw.ticket_ids);
  
  const rawGhIssue = raw.gh_issue_number || raw.github_issue_number;
  const ghIssueNumber = rawGhIssue ? Number(rawGhIssue) : null;
  
  const severity = (raw.severity as ClusterSummary["severity"]) || calculateSeverityFromCount(accounts.length);

  return {
    cluster_id: raw.cluster_id,
    severity: severity,
    account_count: accounts.length,
    ticket_count: ticketIds.length,
    ticket_ids: ticketIds,
    gh_issue_number: ghIssueNumber,
    gh_issue_url: ghIssueNumber && (raw.repo_owner || process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER) && (raw.repo_name || process.env.NEXT_PUBLIC_GITHUB_REPO_NAME)
      ? `https://github.com/${raw.repo_owner || process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER}/${raw.repo_name || process.env.NEXT_PUBLIC_GITHUB_REPO_NAME}/issues/${ghIssueNumber}`
      : null,
    last_updated: raw.updated_at ?? "",
  };
}
