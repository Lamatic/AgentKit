"use client";

import type { Diagnosis, DiagnosisHistoryItem, WorkspaceMetadata } from "@/lib/types";

const HISTORY_STORAGE_KEY = "agentkit_diagnosis_history";
const MAX_HISTORY_ITEMS = 50;

export function getDiagnosisHistory(): DiagnosisHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDiagnosisToHistory(
  diagnosis: Diagnosis,
  metadata?: WorkspaceMetadata
): DiagnosisHistoryItem {
  const newItem: DiagnosisHistoryItem = {
    id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    repoOwner: metadata?.repoOwner || "Manual Upload",
    repoName: metadata?.repoName || "Local Log",
    workflowName: metadata?.repoName ? `${metadata.repoName} CI/CD Build` : "Manual Log Upload",
    runNumber: metadata?.runNumber ?? 0,
    branch: metadata?.branch || "main",
    commitSha: metadata?.commitSha ? metadata.commitSha.substring(0, 7) : "head",
    commitMessage: metadata?.commitMessage || "Manual diagnosis scan",
    actorLogin: metadata?.actorLogin || "developer",
    actorAvatar: metadata?.actorAvatar || "",
    timestamp: metadata?.timestamp || new Date().toISOString(),
    diagnosis,
    isBookmarked: false,
  };

  const history = getDiagnosisHistory();
  // Cap history at MAX_HISTORY_ITEMS to prevent localStorage quota exhaustion
  const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      // Storage quota exceeded — notify caller so UI can warn the user
      console.warn("[history-store] Failed to save diagnosis to localStorage:", err);
    }
  }

  return newItem;
}

export function toggleHistoryBookmark(id: string): DiagnosisHistoryItem[] {
  const history = getDiagnosisHistory();
  const updated = history.map((item) =>
    item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
  );
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

export function clearDiagnosisHistory(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
}
