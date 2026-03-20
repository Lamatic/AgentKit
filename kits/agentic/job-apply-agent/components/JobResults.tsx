"use client";

import { useState } from "react";
import { JobResult } from "@/lib/lamatic-client";

interface JobResultsProps {
  candidate: string;
  total: number;
  qualified: number;
  results: JobResult[];
}

export function JobResults({ candidate, total, qualified, results }: JobResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "score-high";
    if (score >= 50) return "score-mid";
    return "score-low";
  };

  return (
    <div className="job-results">
      <div className="results-summary">
        <div className="summary-item">
          <span className="summary-label">Candidate</span>
          <span className="summary-value">{candidate}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Jobs Evaluated</span>
          <span className="summary-value">{total}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Qualified</span>
          <span className="summary-value qualified">{qualified}</span>
        </div>
      </div>

      <div className="results-list">
        {results.map((result, index) => (
          <div
            key={index}
            className={`result-card ${result.qualified ? "result-qualified" : "result-unqualified"}`}
          >
            <div className="result-header">
              <div className="result-meta">
                <h3 className="result-title">{result.job_title}</h3>
                <p className="result-company">
                  {result.company}
                  {result.seniority && (
                    <span className="result-seniority"> · {result.seniority}</span>
                  )}
                </p>
              </div>
              <div className="result-score-block">
                <span className={`result-score ${getScoreColor(result.match_score)}`}>
                  {result.match_score}
                </span>
                <span className="result-score-label">/ 100</span>
                {result.qualified && (
                  <span className="qualified-badge">Qualified</span>
                )}
              </div>
            </div>

            {result.matched_skills && (
              <div className="result-skills">
                <span className="skills-label">Matched skills: </span>
                <span className="skills-value">{result.matched_skills}</span>
              </div>
            )}

            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="result-url"
              >
                View job posting →
              </a>
            )}

            {result.cover_letter && (
              <div className="cover-letter-section">
                <button
                  className="cover-letter-toggle"
                  onClick={() =>
                    setExpandedIndex(expandedIndex === index ? null : index)
                  }
                >
                  {expandedIndex === index
                    ? "Hide cover letter"
                    : "View cover letter"}
                </button>

                {expandedIndex === index && (
                  <div className="cover-letter-body">
                    <pre className="cover-letter-text">{result.cover_letter}</pre>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(result.cover_letter!, index)}
                    >
                      {copiedIndex === index ? "Copied!" : "Copy to clipboard"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!result.cover_letter && (
              <p className="no-cover-letter">
                Match score below threshold — no cover letter generated.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
