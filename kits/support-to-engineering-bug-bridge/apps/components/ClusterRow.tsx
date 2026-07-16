"use client";

import type { ClusterSummary } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";

interface ClusterRowProps {
  cluster: ClusterSummary;
  isSelected: boolean;
  onSelect: () => void;
}

export function ClusterRow({ cluster, isSelected, onSelect }: ClusterRowProps) {
  const shortId = cluster.cluster_id.slice(0, 12);
  const date = cluster.last_updated
    ? new Date(cluster.last_updated).toLocaleString()
    : "—";

  return (
    <tr
      className={`cluster-row${isSelected ? " cluster-row--selected" : ""}`}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      aria-selected={isSelected}
    >
      <td>
        <SeverityBadge severity={cluster.severity} />
      </td>
      <td>
        <span className="cluster-id" title={cluster.cluster_id}>
          {shortId}
        </span>
      </td>
      <td>{cluster.account_count}</td>
      <td>{cluster.ticket_count}</td>
      <td>
        {cluster.gh_issue_number && cluster.gh_issue_url ? (
          <a
            href={cluster.gh_issue_url}
            target="_blank"
            rel="noopener noreferrer"
            className="issue-link"
            onClick={(e) => e.stopPropagation()}
          >
            #{cluster.gh_issue_number}
          </a>
        ) : (
          <span className="singleton-label">No issue yet</span>
        )}
      </td>
      <td className="timestamp" suppressHydrationWarning>{date}</td>
    </tr>
  );
}
