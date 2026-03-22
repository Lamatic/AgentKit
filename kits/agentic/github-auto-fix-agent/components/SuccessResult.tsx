"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ExternalLink,
  FileSearch,
  AlertCircle,
  Bot,
  Terminal,
  GitPullRequest,
  Loader2,
} from "lucide-react";

interface SuccessResultProps {
  result: {
    pr_url?: string;
    analysis?: { summary?: string; root_cause?: string };
    fix?: { explanation?: string; diff?: string; updated_code?: string };
    pr?: {
      branch_name?: string;
      commit_message?: string;
      pr_title?: string;
      pr_body?: string;
    };
  };
  issueUrl: string;
  filePath: string;
}

export default function SuccessResult({
  result,
  issueUrl,
  filePath,
}: SuccessResultProps) {
  const [prUrl, setPrUrl] = useState<string | null>(result.pr_url || null);
  const [creatingPR, setCreatingPR] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);

  const handleCreatePR = async () => {
    if (!result.fix?.updated_code || !result.pr || !filePath) {
      setPrError(
        "Missing data required to create PR. Make sure file path was provided.",
      );
      return;
    }

    setCreatingPR(true);
    setPrError(null);

    try {
      const res = await fetch("/api/create-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_url: issueUrl,
          file_path: filePath,
          fix: { updated_code: result.fix.updated_code },
          pr: result.pr,
        }),
      });

      const data = await res.json();

      if (data.success && data.pr_url) {
        setPrUrl(data.pr_url);
      } else {
        setPrError(data.error || "Failed to create pull request.");
      }
    } catch (err) {
      console.error(err);
      setPrError("An unexpected error occurred while creating the PR.");
    }

    setCreatingPR(false);
  };

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-primary-50 border border-emerald-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-full shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-emerald-900 font-bold text-lg">
              Fix Successfully Generated!
            </h3>
            <p className="text-emerald-700 text-sm">
              The agent has analyzed the issue and generated a patch.
            </p>
          </div>
        </div>

        {/* Show "View Pull Request" if PR was created, otherwise show "Create PR" button */}
        {prUrl ? (
          <a
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl text-primary-900 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            View Pull Request
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        ) : (
          <button
            onClick={handleCreatePR}
            disabled={creatingPR}
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl text-primary-900 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creatingPR ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Creating PR...
              </>
            ) : (
              <>
                <GitPullRequest className="mr-2 h-4 w-4" />
                Create PR
              </>
            )}
          </button>
        )}
      </div>

      {/* PR Error */}
      {prError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200/60 rounded-xl p-4 flex items-start space-x-3"
        >
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{prError}</p>
        </motion.div>
      )}

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ResultCard
          icon={<FileSearch className="w-5 h-5 text-primary-600" />}
          title="Analysis"
          content={result.analysis?.summary || "No summary provided."}
        />
        <ResultCard
          icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
          title="Root Cause"
          content={
            result.analysis?.root_cause || "No root cause identified."
          }
        />
      </div>

      {/* AI Explanation */}
      <div className="bg-surface rounded-2xl border border-border-light p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 bg-primary-100 rounded-lg">
            <Bot className="w-4 h-4 text-primary-700" />
          </div>
          <h2 className="font-bold text-text-primary">AI Explanation</h2>
        </div>
        <p className="text-text-secondary leading-relaxed text-sm">
          {result.fix?.explanation ||
            "No explanation provided for the fix."}
        </p>
      </div>

      {/* Code Diff */}
      <div className="bg-[#0D1117] rounded-2xl shadow-xl overflow-hidden border border-[#30363D]">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#161B22] border-b border-[#30363D]">
          <div className="flex items-center space-x-2.5 text-slate-400">
            <Terminal className="w-4 h-4" />
            <span className="text-sm font-semibold font-mono">
              Suggested Fix (Diff)
            </span>
          </div>
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#F85149]/60" />
            <span className="w-3 h-3 rounded-full bg-primary-500/60" />
            <span className="w-3 h-3 rounded-full bg-[#3FB950]/60" />
          </div>
        </div>
        <div className="p-5 overflow-x-auto">
          <pre className="text-[13px] leading-6 font-mono text-slate-300">
            <code
              dangerouslySetInnerHTML={{
                __html: result.fix?.diff
                  ? result.fix.diff.replace(
                      /^(.*?)$/gm,
                      (line: string) => {
                        if (line.startsWith("+"))
                          return `<span class="text-[#3FB950] bg-[#2EA04326] block w-full px-3 -mx-3 rounded">${line}</span>`;
                        if (line.startsWith("-"))
                          return `<span class="text-[#F85149] bg-[#F8514926] block w-full px-3 -mx-3 rounded">${line}</span>`;
                        return `<span class="text-slate-400 block px-3 -mx-3">${line}</span>`;
                      }
                    )
                  : "No diff available.",
              }}
            />
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

function ResultCard({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border-light p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center space-x-2 mb-3">
        <div className="p-1.5 bg-primary-100 rounded-lg">{icon}</div>
        <h2 className="font-bold text-text-primary">{title}</h2>
      </div>
      <p className="text-text-secondary leading-relaxed text-sm">{content}</p>
    </div>
  );
}
