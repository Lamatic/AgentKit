"use client";

import { useState } from "react";
import { ResumeInput } from "@/components/ResumeInput";
import { JobUrlInput } from "@/components/JobUrlInput";
import { JobResults } from "@/components/JobResults";
import { orchestrate, OrchestrateResult } from "@/actions/orchestrate";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jobUrls, setJobUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestrateResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await orchestrate({
        resume,
        job_urls: jobUrls.filter((u) => u.trim().length > 0),
      });
      setResult(response);
    } catch (err) {
      setResult({ success: false, error: "Unexpected error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">ApplyBud</span>
          </div>
          <p className="tagline">
            Paste your resume. Drop job URLs. Get your match score and cover letter instantly.
          </p>
        </div>
      </header>

      <div className="content">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-grid">
            <ResumeInput
              value={resume}
              onChange={setResume}
              disabled={loading}
            />
            <JobUrlInput
              urls={jobUrls}
              onChange={setJobUrls}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !resume.trim() || jobUrls.every((u) => !u.trim())}
          >
            {loading ? (
              <span className="loading-state">
                <span className="spinner" />
                Analysing jobs...
              </span>
            ) : (
              "Analyse & Generate"
            )}
          </button>
        </form>

        {result && !result.success && (
          <div className="error-banner">
            <strong>Error:</strong> {result.error}
          </div>
        )}

        {result && result.success && result.data && (
          <JobResults
            candidate={result.data.candidate}
            total={result.data.total_jobs_evaluated}
            qualified={result.data.qualified_jobs}
            results={result.data.results}
          />
        )}
      </div>

      <style jsx>{`
        .main {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f0ede8;
          font-family: 'DM Mono', 'Courier New', monospace;
        }
        .header {
          border-bottom: 1px solid #1e1e1e;
          padding: 32px 0;
        }
        .header-inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .logo-icon { font-size: 24px; }
        .logo-text {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.5px;
          color: #f0ede8;
        }
        .tagline {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
        }
        .content {
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
        }
        .submit-btn {
          width: 100%;
          padding: 14px 24px;
          background: #f0ede8;
          color: #0a0a0a;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 0.15s;
          letter-spacing: 0.02em;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.88; }
        .submit-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #0a0a0a;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-banner {
          margin-top: 24px;
          padding: 14px 16px;
          background: #1a0808;
          border: 1px solid #3a1010;
          border-radius: 8px;
          color: #f87171;
          font-size: 14px;
        }

        :global(.resume-input),
        :global(.job-url-input) {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        :global(label) {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #888;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        :global(.label-hint) {
          font-size: 11px;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          color: #555;
        }
        :global(textarea),
        :global(input[type="url"]) {
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          color: #f0ede8;
          font-family: inherit;
          font-size: 13px;
          padding: 12px 14px;
          resize: vertical;
          transition: border-color 0.15s;
          width: 100%;
        }
        :global(textarea:focus),
        :global(input[type="url"]:focus) {
          outline: none;
          border-color: #444;
        }
        :global(.char-count) {
          font-size: 11px;
          color: #444;
          text-align: right;
        }
        :global(.url-list) { display: flex; flex-direction: column; gap: 8px; }
        :global(.url-row) { display: flex; gap: 8px; align-items: center; }
        :global(.remove-btn) {
          background: none;
          border: 1px solid #222;
          color: #666;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :global(.remove-btn:hover) { border-color: #444; color: #f0ede8; }
        :global(.add-btn) {
          background: none;
          border: 1px dashed #333;
          color: #666;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        :global(.add-btn:hover:not(:disabled)) { border-color: #555; color: #f0ede8; }
        :global(.url-hint) { font-size: 11px; color: #444; line-height: 1.5; }

        :global(.job-results) { margin-top: 40px; }
        :global(.results-summary) {
          display: flex;
          gap: 32px;
          padding: 20px 0;
          border-bottom: 1px solid #1e1e1e;
          margin-bottom: 24px;
        }
        :global(.summary-label) { font-size: 11px; color: #555; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        :global(.summary-value) { font-size: 20px; font-weight: 600; color: #f0ede8; }
        :global(.summary-value.qualified) { color: #4ade80; }
        :global(.results-list) { display: flex; flex-direction: column; gap: 16px; }
        :global(.result-card) {
          border: 1px solid #1e1e1e;
          border-radius: 10px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.15s;
        }
        :global(.result-qualified) { border-color: #1a3a1a; }
        :global(.result-card:hover) { border-color: #2a2a2a; }
        :global(.result-header) { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        :global(.result-title) { font-size: 16px; font-weight: 600; color: #f0ede8; margin: 0 0 4px; }
        :global(.result-company) { font-size: 13px; color: #666; margin: 0; }
        :global(.result-seniority) { color: #555; }
        :global(.result-score-block) { display: flex; align-items: baseline; gap: 4px; flex-shrink: 0; }
        :global(.result-score) { font-size: 28px; font-weight: 700; }
        :global(.score-high) { color: #4ade80; }
        :global(.score-mid) { color: #facc15; }
        :global(.score-low) { color: #f87171; }
        :global(.result-score-label) { font-size: 13px; color: #555; }
        :global(.qualified-badge) {
          margin-left: 8px;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          background: #1a3a1a;
          color: #4ade80;
          border-radius: 20px;
          border: 1px solid #2a5a2a;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        :global(.result-skills) { font-size: 13px; color: #666; }
        :global(.skills-label) { color: #555; }
        :global(.skills-value) { color: #888; }
        :global(.result-url) { font-size: 12px; color: #555; text-decoration: none; }
        :global(.result-url:hover) { color: #f0ede8; }
        :global(.cover-letter-toggle) {
          background: none;
          border: 1px solid #222;
          color: #888;
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          align-self: flex-start;
        }
        :global(.cover-letter-toggle:hover) { border-color: #444; color: #f0ede8; }
        :global(.cover-letter-body) { display: flex; flex-direction: column; gap: 12px; }
        :global(.cover-letter-text) {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          padding: 16px;
          font-size: 13px;
          line-height: 1.75;
          color: #ccc;
          white-space: pre-wrap;
          font-family: inherit;
          margin: 0;
        }
        :global(.copy-btn) {
          align-self: flex-start;
          background: none;
          border: 1px solid #222;
          color: #666;
          border-radius: 6px;
          padding: 7px 14px;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        :global(.copy-btn:hover) { border-color: #444; color: #f0ede8; }
        :global(.no-cover-letter) { font-size: 12px; color: #444; font-style: italic; }
      `}</style>
    </main>
  );
}
