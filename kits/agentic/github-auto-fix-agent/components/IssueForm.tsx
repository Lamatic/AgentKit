"use client";

import { motion } from "framer-motion";
import { Github, FileCode2, Loader2, Zap } from "lucide-react";

interface IssueFormProps {
  issueUrl: string;
  setIssueUrl: (url: string) => void;
  filePath: string;
  setFilePath: (path: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function IssueForm({
  issueUrl,
  setIssueUrl,
  filePath,
  setFilePath,
  loading,
  onSubmit,
}: IssueFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-surface rounded-3xl shadow-xl shadow-primary-500/[0.04] border border-border-light p-8 md:p-10 mb-10 hover:shadow-2xl hover:shadow-primary-500/[0.06] transition-shadow duration-500"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-5">
          {/* Issue URL */}
          <div className="group">
            <label
              className="block text-sm font-semibold text-text-primary mb-2 tracking-wide uppercase"
              htmlFor="issueUrl"
            >
              GitHub Issue URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Github className="h-5 w-5 text-text-tertiary group-focus-within:text-primary-600 transition-colors duration-200" />
              </div>
              <input
                id="issueUrl"
                className="block w-full pl-12 pr-4 py-3.5 bg-primary-50/40 border border-border-medium rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-white transition-all duration-200 text-sm"
                placeholder="https://github.com/owner/repo/issues/123"
                value={issueUrl}
                onChange={(e) => setIssueUrl(e.target.value)}
                required
              />
            </div>
          </div>

          {/* File Path */}
          <div className="group">
            <label
              className="block text-sm font-semibold text-text-primary mb-2 tracking-wide uppercase"
              htmlFor="filePath"
            >
              Target File Path{" "}
              <span className="text-text-tertiary font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FileCode2 className="h-5 w-5 text-text-tertiary group-focus-within:text-primary-600 transition-colors duration-200" />
              </div>
              <input
                id="filePath"
                className="block w-full pl-12 pr-4 py-3.5 bg-primary-50/40 border border-border-medium rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-white transition-all duration-200 text-sm"
                placeholder="e.g. src/components/Button.tsx"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center items-center py-4 px-8 text-base font-semibold rounded-xl text-primary-900 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 hover:from-primary-500 hover:via-primary-600 hover:to-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-800" />
              <span>Processing Issue...</span>
            </>
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5 text-primary-800 group-hover:scale-110 transition-transform" />
              <span>Fix Issue & Create PR</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
