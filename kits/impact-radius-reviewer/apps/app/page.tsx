"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  impactReviewSchema,
  type ImpactReviewFormInput,
} from "../lib/schema";
import { generateImpactBrief } from "../actions/orchestrate";

/** Main Impact Radius Reviewer page: a form that submits to the impact-review Lamatic flow. */
export default function Page() {
  const [output, setOutput] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [credentialDetected, setCredentialDetected] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ImpactReviewFormInput>({
    resolver: zodResolver(impactReviewSchema),
  });

  /** Submits validated form data to the server action and shows the result or an error. */
  async function onSubmit(data: ImpactReviewFormInput) {
    setServerError(null);
    setOutput(null);
    setCredentialDetected(false);
    try {
      const result = await generateImpactBrief(data);
      if (!result.ok) {
        setServerError(result.error ?? "Unknown error");
        if (result.credentialDetected) setCredentialDetected(true);
        return;
      }
      setOutput(result.output ?? "");
      if (result.credentialDetected) setCredentialDetected(true);
    } catch (err: any) {
      setServerError(err?.message ?? "Request failed.");
    }
  }

  /** Copies the generated output to the clipboard. */
  async function copyOutput() {
    if (output) await navigator.clipboard.writeText(output);
  }

  return (
    <main className="ir-page">
      <h1 className="ir-title">Impact Radius Reviewer</h1>
      <p className="ir-description">
        Paste your <code>diffcontext compile --json</code> output and the PR
        diff. Get a reviewer brief: what will break, test coverage, and the
        blind spots static analysis cannot see.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="ir-field">
          <label htmlFor="diffcontextJson" className="ir-label">
            DiffContext JSON
            <span className="ir-hint">
              {" "}
              &mdash; output of{" "}
              <code>
                diffcontext compile --cutoff gap --json
              </code>
            </span>
          </label>
          <textarea
            id="diffcontextJson"
            className="ir-input"
            rows={10}
            placeholder={`e.g.\n{\n  "symbol_count": 2,\n  "included_symbols": [...],\n  "dropped_symbols": [...],\n  "context": "..."\n}`}
            {...register("diffcontextJson")}
          />
          {errors.diffcontextJson && (
            <p className="ir-error-text">{errors.diffcontextJson.message}</p>
          )}
        </div>

        <div className="ir-field-last">
          <label htmlFor="prDiff" className="ir-label">
            PR diff
            <span className="ir-hint">
              {" "}
              &mdash; output of <code>git diff</code>
            </span>
          </label>
          <textarea
            id="prDiff"
            className="ir-input"
            rows={6}
            placeholder={`e.g.\ndiff --git a/src/foo.py b/src/foo.py\n-    def get(self) -> list:\n-        return self._items.copy()\n+    def get(self) -> tuple:\n+        return tuple(self._items)`}
            {...register("prDiff")}
          />
          {errors.prDiff && (
            <p className="ir-error-text">{errors.prDiff.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="ir-button">
          {isSubmitting ? "Generating brief…" : "Generate reviewer brief"}
        </button>
      </form>

      {serverError && (
        <p role="alert" className="ir-result-error">{serverError}</p>
      )}

      {credentialDetected && (
        <p className="ir-credential-note">
          A credential was detected in the input and redacted using the marker
          [credential detected; value omitted].
        </p>
      )}

      {output && (
        <div className="ir-result-block">
          <div className="ir-result-header">
            <label className="ir-label">Reviewer brief</label>
            <button onClick={copyOutput} className="ir-copy-button">
              Copy
            </button>
          </div>
          <pre className="ir-output">{output}</pre>
        </div>
      )}
    </main>
  );
}
