"use client";

import { useEffect, useState, useMemo } from "react";
import type { GitHubRepo } from "@/lib/types";
import { GitHubWorkflowList } from "./github-workflow-list";

const SELECTED_REPO_STORAGE_KEY = "agentkit_selected_github_repo";

interface GitHubRepoSelectorProps {
  onSelectRepo?: (repo: GitHubRepo | null) => void;
  onDiagnoseRun?: (run: any) => void;
}

export function GitHubRepoSelector({ onSelectRepo, onDiagnoseRun }: GitHubRepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "name" | "stars">("updated");
  
  // Selection state
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load saved selection from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SELECTED_REPO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GitHubRepo;
        setSelectedRepo(parsed);
        if (onSelectRepo) onSelectRepo(parsed);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [onSelectRepo]);

  // Fetch repositories from API
  useEffect(() => {
    async function loadRepos() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`/api/github/repos?page=1&per_page=100&sort=updated`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch repositories.");
        }

        const data = await res.json();
        setRepos(data.repositories || []);
        setHasMore(data.hasMore || false);
        setPage(1);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load GitHub repositories";
        setErrorMsg(message);
      } finally {
        setLoading(false);
      }
    }

    loadRepos();
  }, []);

  // Handle Load More pagination
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/github/repos?page=${nextPage}&per_page=100&sort=updated`);
      if (res.ok) {
        const data = await res.json();
        setRepos((prev) => [...prev, ...(data.repositories || [])]);
        setHasMore(data.hasMore || false);
        setPage(nextPage);
      }
    } catch {
      // Keep existing list on failure
    } finally {
      setLoadingMore(false);
    }
  };

  // Select / Deselect repository
  const handleSelect = (repo: GitHubRepo) => {
    if (selectedRepo?.id === repo.id) {
      // Deselect
      setSelectedRepo(null);
      localStorage.removeItem(SELECTED_REPO_STORAGE_KEY);
      if (onSelectRepo) onSelectRepo(null);
    } else {
      // Select
      setSelectedRepo(repo);
      localStorage.setItem(SELECTED_REPO_STORAGE_KEY, JSON.stringify(repo));
      if (onSelectRepo) onSelectRepo(repo);
    }
  };

  // Filter & Sort Repositories dynamically
  const filteredRepos = useMemo(() => {
    let list = [...repos];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.owner.login.toLowerCase().includes(query) ||
          (r.language && r.language.toLowerCase().includes(query)) ||
          (r.description && r.description.toLowerCase().includes(query))
      );
    }

    // Sort list
    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "stars") {
      list.sort((a, b) => b.stargazersCount - a.stargazersCount);
    } else {
      // "updated" default
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return list;
  }, [repos, searchQuery, sortBy]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="glass-panel rounded-[24px] p-6 mb-6 transition-all duration-300">
      {/* Active Selected Repository Header Banner */}
      {selectedRepo && (
        <>
          <div className="mb-6 rounded-[18px] border border-cyan-500/30 bg-cyan-950/30 p-4 backdrop-blur-md flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <img
                src={selectedRepo.owner.avatarUrl}
                alt={selectedRepo.owner.login}
                className="h-9 w-9 rounded-full border border-white/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyan-400 font-mono">{selectedRepo.owner.login} /</span>
                  <span className="font-semibold text-white text-sm">{selectedRepo.name}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 pulse-glow" />
                    Active Repository
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Default branch: <span className="font-mono text-white/80">{selectedRepo.defaultBranch}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSelect(selectedRepo)}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-200 hover:underline transition-all"
            >
              Change Repository
            </button>
          </div>

          {/* GX-3 Workflow & Failure Discovery Layer */}
          <GitHubWorkflowList repo={selectedRepo} onDiagnoseRun={onDiagnoseRun} />
        </>
      )}

      {/* Header controls: Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search repositories by name, owner, or language..."
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

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)] whitespace-nowrap">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "updated" | "name" | "stars")}
            className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="updated" className="bg-black text-white">Recently Updated</option>
            <option value="name" className="bg-black text-white">Alphabetical (A-Z)</option>
            <option value="stars" className="bg-black text-white">Most Starred</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 mb-4">
          <strong>Error loading repositories:</strong> {errorMsg}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[16px] border border-white/5 bg-white/5 p-4 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-3 w-12 bg-white/5 rounded-full" />
              </div>
              <div className="h-3 w-48 bg-white/5 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-3 w-16 bg-white/5 rounded" />
                <div className="h-6 w-16 bg-white/10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRepos.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center border border-dashed border-white/10 rounded-[18px]">
          <p className="text-sm font-medium text-white">No repositories found</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            {searchQuery ? `No matches for "${searchQuery}"` : "Your account does not have access to any repositories."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-3 text-xs text-cyan-400 hover:underline font-medium"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        /* Repository Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {filteredRepos.map((repo) => {
            const isSelected = selectedRepo?.id === repo.id;
            return (
              <div
                key={repo.id}
                className={`rounded-[16px] border p-4 transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "border-cyan-500/60 bg-cyan-950/20 shadow-md"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--muted)] flex-shrink-0">
                        <path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm3 0a1 1 0 00-1 1v7.05A2.49 2.49 0 014.5 10H11V1.5H4.5z" />
                      </svg>
                      <span className="font-semibold text-white text-xs truncate" title={repo.fullName}>
                        {repo.fullName}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        repo.isPrivate
                          ? "border-amber-500/30 bg-amber-950/30 text-amber-400"
                          : "border-emerald-500/30 bg-emerald-950/30 text-emerald-400"
                      }`}
                    >
                      {repo.isPrivate ? "Private" : "Public"}
                    </span>
                  </div>

                  {repo.description && (
                    <p className="text-[11px] text-[var(--muted)] line-clamp-2 mb-3 leading-relaxed">
                      {repo.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-[10px] text-[var(--muted)]">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        {repo.language}
                      </span>
                    )}
                    <span>{formatRelativeTime(repo.updatedAt)}</span>
                  </div>

                  <button
                    onClick={() => handleSelect(repo)}
                    className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-cyan-500 text-black shadow-sm"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {isSelected ? "✓ Selected" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Load More Button */}
      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-[14px] border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {loadingMore ? "Loading more..." : "Load More Repositories"}
          </button>
        </div>
      )}
    </div>
  );
}
