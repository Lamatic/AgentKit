"use client";

import type { ClusterSummary } from "@/lib/types";

interface ClusterDetailProps {
  cluster: ClusterSummary;
  onClose: () => void;
}

export function ClusterDetail({ cluster, onClose }: ClusterDetailProps) {
  return (
    <aside className="detail-panel" aria-label="Cluster detail">
      <div className="detail-header">
        <div>
          <h2 className="detail-title">Cluster Detail</h2>
          <code className="detail-cluster-id">{cluster.cluster_id}</code>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="detail-meta">
        <div className="detail-stat">
          <span className="detail-label">Severity</span>
          <span className={`detail-sev detail-sev--${cluster.severity.toLowerCase()}`}>
            {cluster.severity}
          </span>
        </div>
        <div className="detail-stat">
          <span className="detail-label">Distinct Accounts</span>
          <span className="detail-value">{cluster.account_count}</span>
        </div>
        <div className="detail-stat">
          <span className="detail-label">GitHub Issue</span>
          <span className="detail-value">
            {cluster.gh_issue_number && cluster.gh_issue_url ? (
              <a
                href={cluster.gh_issue_url}
                target="_blank"
                rel="noopener noreferrer"
                className="issue-link"
              >
                #{cluster.gh_issue_number}
              </a>
            ) : (
              <span className="singleton-label">No issue yet</span>
            )}
          </span>
        </div>
        <div className="detail-stat">
          <span className="detail-label">Last Updated</span>
          <span className="detail-value" suppressHydrationWarning>
            {cluster.last_updated
              ? new Date(cluster.last_updated).toLocaleString()
              : "—"}
          </span>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">
          Accumulation Timeline ({cluster.ticket_count} tickets)
        </h3>
        <p className="detail-section-note">
          Tickets are ordered by ID. Each entry represents a distinct support report
          that contributed to this cluster.
        </p>
        <ol className="ticket-list">
          {cluster.ticket_ids.map((id, i) => (
            <li key={id} className="ticket-item">
              <span className="ticket-index">{i + 1}</span>
              <span className="ticket-id">Zendesk #{id}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
