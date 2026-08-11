"use client";

import { useEffect, useState } from "react";
import type { DiagnosisHistoryItem } from "@/lib/types";
import { getDiagnosisHistory, toggleHistoryBookmark } from "@/lib/history/history-store";
import { DashboardMetrics } from "./dashboard-metrics";
import { DashboardAnalytics } from "./dashboard-analytics";
import { DashboardHistoryTable } from "./dashboard-history-table";
import { DashboardCompareModal } from "./dashboard-compare-modal";

interface TeamDashboardProps {
  onSelectForView?: (item: DiagnosisHistoryItem) => void;
}

export function TeamDashboard({ onSelectForView }: TeamDashboardProps) {
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);
  const [compareItems, setCompareItems] = useState<[DiagnosisHistoryItem, DiagnosisHistoryItem] | null>(null);

  useEffect(() => {
    setHistory(getDiagnosisHistory());
  }, []);

  const handleToggleBookmark = (id: string) => {
    const updated = toggleHistoryBookmark(id);
    setHistory(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Metrics Cards */}
      <DashboardMetrics history={history} />

      {/* Analytics & Repository Health Matrix */}
      <DashboardAnalytics history={history} />

      {/* History Audit Table & Compare mode */}
      <DashboardHistoryTable
        history={history}
        onToggleBookmark={handleToggleBookmark}
        onSelectForView={(item) => onSelectForView && onSelectForView(item)}
        onCompareSelected={(items) => setCompareItems(items)}
      />

      {/* Compare Modal */}
      {compareItems && (
        <DashboardCompareModal
          items={compareItems}
          onClose={() => setCompareItems(null)}
        />
      )}
    </div>
  );
}
