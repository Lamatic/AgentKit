import type { Diagnosis, DiagnosisHistoryItem, WorkspaceMetadata } from "@/lib/types";

const HISTORY_STORAGE_KEY = "agentkit_diagnosis_history_v2";

/**
 * Retrieves full diagnosis history array from localStorage (starts empty if no diagnoses performed yet)
 */
export function getDiagnosisHistory(): DiagnosisHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as DiagnosisHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a newly completed diagnosis dynamically into local history
 */
export function saveDiagnosisToHistory(
  diagnosis: Diagnosis,
  metadata?: WorkspaceMetadata | null
): DiagnosisHistoryItem {
  const newItem: DiagnosisHistoryItem = {
    id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    repoOwner: metadata?.repoOwner || "Manual Upload",
    repoName: metadata?.repoName || "Local Log",
    workflowName: metadata?.repoName ? `${metadata.repoName} CI/CD Build` : "Manual Log Upload",
    runNumber: metadata?.runNumber || Math.floor(Math.random() * 100) + 1,
    branch: metadata?.branch || "main",
    commitSha: metadata?.commitSha ? metadata.commitSha.substring(0, 7) : "head",
    commitMessage: "Automated AI Diagnostic Scan",
    actorLogin: metadata?.actorLogin || "developer",
    actorAvatar: metadata?.actorAvatar || "",
    timestamp: metadata?.timestamp || new Date().toISOString(),
    diagnosis,
    isBookmarked: false,
  };

  const history = getDiagnosisHistory();
  const updated = [newItem, ...history];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
  }

  return newItem;
}

/**
 * Toggles bookmark status of a specific diagnosis
 */
export function toggleHistoryBookmark(id: string): DiagnosisHistoryItem[] {
  const history = getDiagnosisHistory();
  const updated = history.map((item) => (item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item));

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  return updated;
}

/**
 * Clears stored history
 */
export function clearDiagnosisHistory(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
