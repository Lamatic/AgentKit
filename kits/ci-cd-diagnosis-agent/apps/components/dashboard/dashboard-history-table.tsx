"use client";

import { useState, useMemo } from "react";
import type { DiagnosisHistoryItem } from "@/lib/types";
import { riskToBadgeBg } from "@/lib/utils";

interface DashboardHistoryTableProps {
  history: DiagnosisHistoryItem[];
  onToggleBookmark: (id: string) => void;
  onSelectForView: (item: DiagnosisHistoryItem) => void;
  onCompareSelected: (items: [DiagnosisHistoryItem, DiagnosisHistoryItem]) => void;
}

export function DashboardHistoryTable({
  history,
  onToggleBookmark,
  onSelectForView,
  onCompareSelected,
}: DashboardHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low" | "bookmarked">("all");
  const [selectedIdsForCompare, setSelectedIdsForCompare] = useState<string[]>([]);

  // Filter history
  const filteredHistory = useMemo(() => {
    let list = [...history];

    // Filter by Risk / Bookmarked tab
    if (riskFilter === "bookmarked") {
      list = list.filter((item) => item.isBookmarked);
    } else if (riskFilter === "high") {
      list = list.filter((item) => item.diagnosis.risk.level === "High");
    } else if (riskFilter === "medium") {
      list = list.filter((item) => item.diagnosis.risk.level === "Medium");
    } else if (riskFilter === "low") {
      list = list.filter((item) => item.diagnosis.risk.level === "Low");
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.repoName.toLowerCase().includes(q) ||
          item.repoOwner.toLowerCase().includes(q) ||
          item.workflowName.toLowerCase().includes(q) ||
          item.commitSha.toLowerCase().includes(q) ||
          item.commitMessage.toLowerCase().includes(q) ||
          item.diagnosis.analysis.root_cause_summary.toLowerCase().includes(q) ||
          item.diagnosis.classification.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [history, riskFilter, searchQuery]);

  const handleToggleCompareCheckbox = (id: string) => {
    if (selectedIdsForCompare.includes(id)) {
      setSelectedIdsForCompare(selectedIdsForCompare.filter((i) => i !== id));
    } else {
      if (selectedIdsForCompare.length >= 2) {
        // Keep latest 2
        setSelectedIdsForCompare([selectedIdsForCompare[1], id]);
      } else {
        setSelectedIdsForCompare([...selectedIdsForCompare, id]);
      }
    }
  };

  const handleTriggerCompare = () => {
    if (selectedIdsForCompare.length === 2) {
      const item1 = history.find((h) => h.id === selectedIdsForCompare[0]);
      const item2 = history.find((h) => h.id === selectedIdsForCompare[1]);
      if (item1 && item2) {
        onCompareSelected([item1, item2]);
      }
    }
  };

  return (
    <div className="glass-panel rounded-[24px] p-6 space-y-5">
      {/* Header controls: Title & Compare CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-sm font-semibold text-white">Diagnosis History & Audit Log</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Browse, search, bookmark, and compare previous AI diagnoses
          </p>
        </div>

        {selectedIdsForCompare.length === 2 && (
          <button
            onClick={handleTriggerCompare}
            className="apple-button rounded-[14px] px-4 py-2 text-xs font-semibold shadow-lg animate-fade-in flex items-center gap-1.5"
          >
            <span>⚖️</span> Compare Selected (2 Diagnoses)
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search history by repo, workflow, commit SHA, or root cause..."
            className="w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-[var(--muted)] focus:border-cyan-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-[var(--muted)] hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "bookmarked", label: "★ Saved" },
            { id: "high", label: "High Risk" },
            { id: "medium", label: "Medium" },
            { id: "low", label: "Low Risk" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRiskFilter(tab.id as any)}
              className={`rounded-[12px] px-3 py-1.5 text-xs font-medium transition-all ${
                riskFilter === tab.id
                  ? "bg-white/15 text-white border border-white/20"
                  : "text-[var(--muted)] hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table List */}
      {filteredHistory.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-white/10 rounded-[18px]">
          <p className="text-sm font-medium text-white">No historical diagnoses found</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            {searchQuery ? `No matches for "${searchQuery}"` : "Perform your first diagnosis to build history."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[var(--muted)] font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2 w-8">Compare</th>
                <th className="py-3 px-2 w-8">Save</th>
                <th className="py-3 px-3">Repository & Workflow</th>
                <th className="py-3 px-3">Commit / Branch</th>
                <th className="py-3 px-3">Root Cause Summary</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90">
              {filteredHistory.map((item) => {
                const isChecked = selectedIdsForCompare.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-white/5 transition-all group cursor-pointer"
                  >
                    {/* Compare Checkbox */}
                    <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCompareCheckbox(item.id)}
                        className="rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Bookmark Star Button */}
                    <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleBookmark(item.id)}
                        className={`text-sm transition-all ${
                          item.isBookmarked ? "text-amber-400" : "text-white/20 hover:text-amber-300"
                        }`}
                      >
                        {item.isBookmarked ? "★" : "☆"}
                      </button>
                    </td>

                    {/* Repository & Workflow */}
                    <td className="py-3 px-3" onClick={() => onSelectForView(item)}>
                      <div className="font-semibold text-white group-hover:text-cyan-300 transition-all">
                        {item.repoOwner}/{item.repoName}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        #{item.runNumber} {item.workflowName}
                      </div>
                    </td>

                    {/* Commit & Branch */}
                    <td className="py-3 px-3 font-mono text-[11px]" onClick={() => onSelectForView(item)}>
                      <span className="text-cyan-400">{item.branch}</span>
                      <span className="text-[var(--muted)] ml-1">({item.commitSha})</span>
                    </td>

                    {/* Root Cause */}
                    <td className="py-3 px-3 max-w-xs truncate" onClick={() => onSelectForView(item)}>
                      <span className="font-medium text-white/90" title={item.diagnosis.analysis.root_cause_summary}>
                        {item.diagnosis.analysis.root_cause_summary}
                      </span>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-3" onClick={() => onSelectForView(item)}>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${riskToBadgeBg(item.diagnosis.risk.level)}`}>
                        {item.diagnosis.risk.level}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-right text-[11px] text-[var(--muted)]" onClick={() => onSelectForView(item)}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
