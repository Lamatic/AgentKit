"use client";

import { useEffect, useState, useMemo } from "react";
import type { GitHubRepo, GitHubWorkflow, GitHubWorkflowRun, WorkflowConclusion, WorkflowStatus } from "@/lib/types";

const SELECTED_RUN_STORAGE_KEY = "agentkit_selected_workflow_run";

interface GitHubWorkflowListProps {
  repo: GitHubRepo;
  onSelectRun?: (run: GitHubWorkflowRun | null) => void;
  onDiagnoseRun?: (run: GitHubWorkflowRun) => void;
}

export function GitHubWorkflowList({ repo, onSelectRun, onDiagnoseRun }: GitHubWorkflowListProps) {
  const [workflows, setWorkflows] = useState<GitHubWorkflow[]>([]);
  const [runs, setRuns] = useState<GitHubWorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "failure" | "in_progress" | "success">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "failed_first">("newest");

  // Run selection state
  const [selectedRun, setSelectedRun] = useState<GitHubWorkflowRun | null>(null);

  // Load saved run selection from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SELECTED_RUN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { run: GitHubWorkflowRun; repoId: number };
        if (parsed.repoId === repo.id) {
          setSelectedRun(parsed.run);
          if (onSelectRun) onSelectRun(parsed.run);
        }
      }
    } catch {
      // Ignore
    }
  }, [repo.id, onSelectRun]);

  // Fetch workflows and runs for selected repo
  useEffect(() => {
    async function loadWorkflowsAndRuns() {
      setLoading(true);
      setErrorMsg(null);

      try {
        // Fetch Workflows & Runs in parallel
        const [wfRes, runsRes] = await Promise.all([
          fetch(`/api/github/workflows?owner=${repo.owner.login}&repo=${repo.name}`),
          fetch(`/api/github/runs?owner=${repo.owner.login}&repo=${repo.name}&per_page=50`),
        ]);

        if (!wfRes.ok) {
          const errData = await wfRes.json();
          throw new Error(errData.error || "Failed to load GitHub workflows.");
        }
        if (!runsRes.ok) {
          const errData = await runsRes.json();
          throw new Error(errData.error || "Failed to load workflow runs.");
        }

        const wfData = await wfRes.json();
        const runsData = await runsRes.json();

        setWorkflows(wfData.workflows || []);
        setRuns(runsData.runs || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load GitHub Actions data.";
        setErrorMsg(message);
      } finally {
        setLoading(false);
      }
    }

    loadWorkflowsAndRuns();
  }, [repo.owner.login, repo.name]);

  // Handle run selection
  const handleSelectRun = (run: GitHubWorkflowRun) => {
    if (selectedRun?.id === run.id) {
      setSelectedRun(null);
      localStorage.removeItem(SELECTED_RUN_STORAGE_KEY);
      if (onSelectRun) onSelectRun(null);
    } else {
      setSelectedRun(run);
      localStorage.setItem(SELECTED_RUN_STORAGE_KEY, JSON.stringify({ run, repoId: repo.id }));
      if (onSelectRun) onSelectRun(run);
    }
  };

  // Filter & Sort runs dynamically
  const filteredRuns = useMemo(() => {
    let list = [...runs];

    // Filter by specific workflow dropdown
    if (selectedWorkflowId !== "all") {
      const targetWfId = parseInt(selectedWorkflowId, 10);
      list = list.filter((r) => r.workflowId === targetWfId);
    }

    // Filter by Status Tab
    if (statusFilter === "failure") {
      list = list.filter((r) => r.conclusion === "failure" || r.conclusion === "timed_out");
    } else if (statusFilter === "in_progress") {
      list = list.filter((r) => r.status === "in_progress" || r.status === "queued");
    } else if (statusFilter === "success") {
      list = list.filter((r) => r.conclusion === "success");
    }

    // Filter by Search Query (name, branch, commit sha, commit message)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.headBranch.toLowerCase().includes(q) ||
          r.headSha.toLowerCase().includes(q) ||
          r.headCommitMessage.toLowerCase().includes(q) ||
          r.actor.login.toLowerCase().includes(q)
      );
    }

    // Sort list
    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "failed_first") {
      list.sort((a, b) => {
        const aFail = a.conclusion === "failure" ? 1 : 0;
        const bFail = b.conclusion === "failure" ? 1 : 0;
        return bFail - aFail;
      });
    } else {
      // "newest" default
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [runs, selectedWorkflowId, statusFilter, searchQuery, sortBy]);

  // Render Status Badge Component
  const renderStatusBadge = (status: WorkflowStatus, conclusion: WorkflowConclusion) => {
    if (status === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-[10px] font-medium text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 pulse-glow" />
          In Progress
        </span>
      );
    }

    if (status === "queued" || status === "waiting") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          Queued
        </span>
      );
    }

    switch (conclusion) {
      case "failure":
      case "timed_out":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-950/50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-300 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            ❌ Failed
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ✅ Success
          </span>
        );
      case "cancelled":
      case "skipped":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
            🚫 {conclusion}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-dim)]">
            {status}
          </span>
        );
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      {/* Active Selected Run Banner */}
      {selectedRun && (
        <div className="mb-6 rounded-[18px] border border-rose-500/40 bg-rose-950/30 p-4 backdrop-blur-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-sm">
              #{selectedRun.runNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">{selectedRun.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 pulse-glow" />
                  Active Failure Selected for Diagnosis
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Branch: <span className="font-mono text-white/80">{selectedRun.headBranch}</span> ({selectedRun.headSha})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDiagnoseRun && (
              <button
                onClick={() => onDiagnoseRun(selectedRun)}
                className="apple-button rounded-[12px] px-3.5 py-1.5 text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <span>⚡</span> Automate AI Diagnosis
              </button>
            )}
            <button
              onClick={() => handleSelectRun(selectedRun)}
              className="text-xs font-medium text-rose-300 hover:text-rose-100 hover:underline transition-all ml-2"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Header controls: Search & Workflow Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Filter runs by workflow name, commit message, or branch..."
            className="w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder:text-[var(--muted)] focus:border-cyan-500 focus:outline-none transition-all"
          />
        </div>

        {/* Workflow Selector & Sorting */}
        <div className="flex gap-2">
          <select
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-black text-white">All Workflows ({workflows.length})</option>
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id.toString()} className="bg-black text-white">
                {wf.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="newest" className="bg-black text-white">Newest First</option>
            <option value="failed_first" className="bg-black text-white">Failed First</option>
            <option value="oldest" className="bg-black text-white">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "all", label: "All Runs" },
          { id: "failure", label: "❌ Failed" },
          { id: "in_progress", label: "⚡ In Progress" },
          { id: "success", label: "✅ Success" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`rounded-[12px] px-3.5 py-1.5 text-xs font-medium transition-all ${
              statusFilter === tab.id
                ? "bg-white/15 text-white border border-white/20"
                : "text-[var(--muted)] hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 mb-4">
          <strong>Error loading workflow runs:</strong> {errorMsg}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[16px] border border-white/5 bg-white/5 p-4 animate-pulse space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-40 bg-white/10 rounded" />
                <div className="h-4 w-16 bg-white/10 rounded-full" />
              </div>
              <div className="h-3 w-64 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-white/10 rounded-[18px]">
          <p className="text-sm font-medium text-white">No workflow runs found</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            {statusFilter === "failure" ? "No failed runs detected for this filter!" : "No executions matching criteria."}
          </p>
        </div>
      ) : (
        /* Workflow Runs List */
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredRuns.map((run) => {
            const isSelected = selectedRun?.id === run.id;
            const isFailed = run.conclusion === "failure" || run.conclusion === "timed_out";

            return (
              <div
                key={run.id}
                className={`rounded-[16px] border p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? "border-rose-500/60 bg-rose-950/20 shadow-md"
                    : isFailed
                    ? "border-rose-500/20 bg-rose-950/10 hover:border-rose-500/40"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={run.actor.avatarUrl}
                    alt={run.actor.login}
                    className="h-8 w-8 rounded-full border border-white/10 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-xs">#{run.runNumber} {run.name}</span>
                      {renderStatusBadge(run.status, run.conclusion)}
                    </div>

                    <p className="text-xs text-[var(--text-dim)] mt-1 line-clamp-1">
                      {run.headCommitMessage}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-[var(--muted)] mt-1">
                      <span className="font-mono text-cyan-400">{run.headBranch}</span>
                      <span>SHA: <code className="text-white/80">{run.headSha}</code></span>
                      <span>By @{run.actor.login}</span>
                      <span>Duration: {formatDuration(run.durationSeconds)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <a
                    href={run.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[10px] border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-[var(--muted)] hover:text-white transition-all"
                  >
                    View on GitHub ↗
                  </a>

                  {isFailed && (
                    <button
                      onClick={() => handleSelectRun(run)}
                      className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                      }`}
                    >
                      {isSelected ? "✓ Selected" : "Select for Diagnosis"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
