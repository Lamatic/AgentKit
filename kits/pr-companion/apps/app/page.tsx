"use client";

import { useState } from "react";
import { generatePRDescription } from "../actions/orchestrate";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontFamily: "ui-monospace, monospace",
  fontSize: 13,
  resize: "vertical",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  marginBottom: 6,
  display: "block",
};

export default function Page() {
  const [diffOrFiles, setDiffOrFiles] = useState("");
  const [commitMessages, setCommitMessages] = useState("");
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setOutput(null);

    const result = await generatePRDescription({ diffOrFiles, commitMessages, intent });

    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Unknown error");
      return;
    }
    setOutput(result.output ?? "");
  }

  async function copyOutput() {
    if (output) await navigator.clipboard.writeText(output);
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>PR Companion</h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>
        Paste your diff (or changed files) and commit messages. Get a review-ready
        PR title, description, checklist, and changelog entry.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Diff or changed files</label>
        <textarea
          style={inputStyle}
          rows={8}
          placeholder={`e.g.\nM  src/webhooks/dispatcher.ts\nA  src/webhooks/retry.ts\n\nor paste a full git diff`}
          value={diffOrFiles}
          onChange={(e) => setDiffOrFiles(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Commit messages</label>
        <textarea
          style={inputStyle}
          rows={4}
          placeholder={"add retry logic to webhook dispatcher\nfix flaky retry test"}
          value={commitMessages}
          onChange={(e) => setCommitMessages(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Intent (optional)</label>
        <input
          style={inputStyle}
          placeholder="One line on why you made this change, if not obvious from commits"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: loading ? "#9ca3af" : "#111827",
          color: "white",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Generating…" : "Generate PR description"}
      </button>

      {error && (
        <p style={{ color: "#dc2626", marginTop: 16 }}>{error}</p>
      )}

      {output && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={labelStyle}>Result</label>
            <button
              onClick={copyOutput}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: "pointer",
              }}
            >
              Copy
            </button>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 16,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {output}
          </pre>
        </div>
      )}
    </main>
  );
}
