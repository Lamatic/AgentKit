import type { Diagnosis, DiagnosisHistoryItem, WorkspaceMetadata } from "@/lib/types";

const HISTORY_STORAGE_KEY = "agentkit_diagnosis_history_v1";

// Initial seed data so the dashboard is immediately rich and interactive
const INITIAL_SEED_HISTORY: DiagnosisHistoryItem[] = [
  {
    id: "diag_seed_101",
    repoOwner: "pawanchhimwal",
    repoName: "AgentKit",
    workflowName: "Deploy to Staging",
    runNumber: 142,
    branch: "main",
    commitSha: "beb0902",
    commitMessage: "UI aesthetic overhaul to Apple level glassmorphism",
    actorLogin: "pawanchhimwal",
    actorAvatar: "https://avatars.githubusercontent.com/u/123456?v=4",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    isBookmarked: true,
    diagnosis: {
      metadata: {
        job_id: "run_101",
        timestamp: new Date().toISOString(),
        ci_provider: "github",
      },
      classification: {
        category: "Infrastructure",
        sub_category: "Memory Limit Exceeded",
        confidence_score: 1.0,
      },
      analysis: {
        root_cause_summary: "JavaScript Heap Out of Memory (OOM Exit Code 137)",
        detailed_explanation:
          "The Next.js build step reached V8's default 1.4 GB memory allocation limit during static page optimization.",
        evidence_cited: [
          "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory",
          "Killed",
        ],
      },
      resolution: {
        is_fix_valid: true,
        verification_notes: "Increasing Node.js V8 memory allocation allocates required heap space.",
        fixes: [
          {
            description: "Set NODE_OPTIONS in Dockerfile",
            language: "dockerfile",
            code: "ENV NODE_OPTIONS=\"--max-old-space-size=4096\"",
          },
        ],
        security_warnings: "Ensure host runner has at least 6 GB allocated RAM.",
      },
      risk: {
        level: "Low",
        warning: "Low operational risk.",
      },
    },
  },
  {
    id: "diag_seed_102",
    repoOwner: "pawanchhimwal",
    repoName: "AgentKit",
    workflowName: "CI Integration Tests",
    runNumber: 141,
    branch: "feature/github-oauth",
    commitSha: "94c63f1",
    commitMessage: "feat(auth): implement GitHub OAuth layer",
    actorLogin: "octocat",
    actorAvatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    isBookmarked: false,
    diagnosis: {
      metadata: {
        job_id: "run_102",
        timestamp: new Date().toISOString(),
        ci_provider: "github",
      },
      classification: {
        category: "Dependencies",
        sub_category: "Peer Dependency Conflict",
        confidence_score: 0.95,
      },
      analysis: {
        root_cause_summary: "npm ERESOLVE unable to resolve dependency tree",
        detailed_explanation:
          "React 19 peer dependency mismatch detected between next@16 and legacy component libraries.",
        evidence_cited: [
          "npm ERR! code ERESOLVE",
          "npm ERR! Could not resolve dependency: peer react@'^18.0.0' from legacy-ui",
        ],
      },
      resolution: {
        is_fix_valid: true,
        verification_notes: "Using npm ci --legacy-peer-deps allows installation without breaking locks.",
        fixes: [
          {
            description: "Update CI workflow install step",
            language: "yaml",
            code: "- run: npm ci --legacy-peer-deps",
          },
        ],
      },
      risk: {
        level: "Medium",
        warning: "Verify component runtime compatibility with React 19.",
      },
    },
  },
];

/**
 * Retrieves full diagnosis history array from localStorage or seed fallback
 */
export function getDiagnosisHistory(): DiagnosisHistoryItem[] {
  if (typeof window === "undefined") return INITIAL_SEED_HISTORY;

  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_SEED_HISTORY));
      return INITIAL_SEED_HISTORY;
    }
    const parsed = JSON.parse(saved) as DiagnosisHistoryItem[];
    return parsed.length > 0 ? parsed : INITIAL_SEED_HISTORY;
  } catch {
    return INITIAL_SEED_HISTORY;
  }
}

/**
 * Saves a newly completed diagnosis into local history
 */
export function saveDiagnosisToHistory(
  diagnosis: Diagnosis,
  metadata?: WorkspaceMetadata | null
): DiagnosisHistoryItem {
  const newItem: DiagnosisHistoryItem = {
    id: `diag_${Date.now()}`,
    repoOwner: metadata?.repoOwner || "pawanchhimwal",
    repoName: metadata?.repoName || "AgentKit",
    workflowName: metadata?.repoName ? `${metadata.repoName} Build Pipeline` : "Manual Upload",
    runNumber: metadata?.runNumber || 143,
    branch: metadata?.branch || "main",
    commitSha: metadata?.commitSha || "8e4c5f2",
    commitMessage: "Automated AI Diagnosis Execution",
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
      // Ignore quota errors
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
