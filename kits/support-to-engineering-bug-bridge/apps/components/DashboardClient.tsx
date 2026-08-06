"use client";

import { useState } from "react";
import type { ClusterSummary } from "@/lib/types";
import { ClusterRow } from "@/components/ClusterRow";
import { ClusterDetail } from "@/components/ClusterDetail";
import { ErrorBanner } from "@/components/ErrorBanner";

interface DashboardClientProps {
  clusters: ClusterSummary[];
  error?: string;
}

export function DashboardClient({ clusters, error }: DashboardClientProps) {
  const [selected, setSelected] = useState<ClusterSummary | null>(null);

  return (
    <div className={`dashboard-layout${selected ? " dashboard-layout--split" : ""}`}>
      <main className="cluster-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Bug Bridge</h1>
            <p className="dashboard-subtitle">
              Support-to-Engineering cluster tracker — data as of page load
            </p>
          </div>
          <div className="dashboard-stats">
            <span className="stat-chip">{clusters.length} clusters</span>
            <span className="stat-chip p1">
              {clusters.filter((c) => c.severity === "P1").length} P1
            </span>
          </div>
        </header>

        {error && <ErrorBanner message={error} />}

        {clusters.length === 0 && !error ? (
          <div className="empty-state">
            <p>No clusters yet. The pipeline will populate this view after the first cron cycle.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="cluster-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Cluster ID</th>
                  <th>Accounts</th>
                  <th>Tickets</th>
                  <th>GitHub Issue</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {clusters.map((c) => (
                  <ClusterRow
                    key={c.cluster_id}
                    cluster={c}
                    isSelected={selected?.cluster_id === c.cluster_id}
                    onSelect={() =>
                      setSelected(selected?.cluster_id === c.cluster_id ? null : c)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selected && (
        <ClusterDetail
          cluster={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
