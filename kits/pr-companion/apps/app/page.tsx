"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { prCompanionSchema, type PRCompanionFormInput } from "../lib/schema";
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

/** Main PR Companion page: a form that submits to the pr-flow Lamatic flow. */
export default function Page() {
  const [output, setOutput] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PRCompanionFormInput>({ resolver: zodResolver(prCompanionSchema) });

  /** Submits validated form data to the server action and shows the result or an error. */
  async function onSubmit(data: PRCompanionFormInput) {
    setServerError(null);
    setOutput(null);
    try {
      const result = await generatePRDescription(data);
      if (!result.ok) {
        setServerError(result.error ?? "Unknown error");
        return;
      }
      setOutput(result.output ?? "");
    } catch (err: any) {
      setServerError(err?.message ?? "Request failed.");
    }
  }

  /** Copies the generated output to the clipboard. */
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="diffOrFiles" style={labelStyle}>Diff or changed files</label>
          <textarea
            id="diffOrFiles"
            style={inputStyle}
            rows={8}
            placeholder={`e.g.\nM  src/webhooks/dispatcher.ts\nA  src/webhooks/retry.ts\n\nor paste a full git diff`}
            {...register("diffOrFiles")}
          />
          {errors.diffOrFiles && (
            <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
              {errors.diffOrFiles.message}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="commitMessages" style={labelStyle}>Commit messages</label>
          <textarea
            id="commitMessages"
            style={inputStyle}
            rows={4}
            placeholder={"add retry logic to webhook dispatcher\nfix flaky retry test"}
            {...register("commitMessages")}
          />
          {errors.commitMessages && (
            <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
              {errors.commitMessages.message}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label htmlFor="intent" style={labelStyle}>Intent (optional)</label>
          <input
            id="intent"
            style={inputStyle}
            placeholder="One line on why you made this change, if not obvious from commits"
            {...register("intent")}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: isSubmitting ? "#9ca3af" : "#111827",
            color: "white",
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Generating…" : "Generate PR description"}
        </button>
      </form>

      {serverError && (
        <p role="alert" style={{ color: "#dc2626", marginTop: 16 }}>{serverError}</p>
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