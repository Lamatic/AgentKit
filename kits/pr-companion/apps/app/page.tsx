"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { prCompanionSchema, type PRCompanionFormInput } from "../lib/schema";
import { generatePRDescription } from "../actions/orchestrate";

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
    <main className="pr-page">
      <h1 className="pr-title">PR Companion</h1>
      <p className="pr-description">
        Paste your diff (or changed files) and commit messages. Get a review-ready
        PR title, description, checklist, and changelog entry.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="pr-field">
          <label htmlFor="diffOrFiles" className="pr-label">Diff or changed files</label>
          <textarea
            id="diffOrFiles"
            className="pr-input"
            rows={8}
            placeholder={`e.g.\nM  src/webhooks/dispatcher.ts\nA  src/webhooks/retry.ts\n\nor paste a full git diff`}
            {...register("diffOrFiles")}
          />
          {errors.diffOrFiles && (
            <p className="pr-error-text">{errors.diffOrFiles.message}</p>
          )}
        </div>

        <div className="pr-field">
          <label htmlFor="commitMessages" className="pr-label">Commit messages</label>
          <textarea
            id="commitMessages"
            className="pr-input"
            rows={4}
            placeholder={"add retry logic to webhook dispatcher\nfix flaky retry test"}
            {...register("commitMessages")}
          />
          {errors.commitMessages && (
            <p className="pr-error-text">{errors.commitMessages.message}</p>
          )}
        </div>

        <div className="pr-field-last">
          <label htmlFor="intent" className="pr-label">Intent (optional)</label>
          <input
            id="intent"
            className="pr-input"
            placeholder="One line on why you made this change, if not obvious from commits"
            {...register("intent")}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="pr-button">
          {isSubmitting ? "Generating…" : "Generate PR description"}
        </button>
      </form>

      {serverError && <p role="alert" className="pr-result-error">{serverError}</p>}

      {output && (
        <div className="pr-result-block">
          <div className="pr-result-header">
            <label className="pr-label">Result</label>
            <button onClick={copyOutput} className="pr-copy-button">Copy</button>
          </div>
          <pre className="pr-output">{output}</pre>
        </div>
      )}
    </main>
  );
}