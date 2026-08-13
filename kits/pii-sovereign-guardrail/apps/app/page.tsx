"use client";

import { useState } from "react";
import { runGuardrail, type GuardrailResult } from "../actions/orchestrate";

const EXAMPLE_PROMPT =
  "Hi, this is John Whitfield. My email is john.whitfield@acme-corp.com and my number is (415) 555-0192. Can you draft a reply to my landlord about the lease at 42 Elm Street, Austin?";

const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

/**
 * Renders masked text, highlighting each [REDACTED_TYPE_n] placeholder
 * as a styled redaction bar with the entity type shown as a tooltip.
 */
function RedactedText({ text }: { text: string }) {
  const parts = text.split(/(\[REDACTED_[A-Z_]+_\d+\])/g);
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
        const match = part.match(/^\[REDACTED_([A-Z_]+)_\d+\]$/);
        if (!match) return <span key={i}>{part}</span>;
        return (
          <span
            key={i}
            title={match[1].replace(/_/g, " ")}
            className="inline-block bg-redact-bar text-redact font-mono text-[0.72em] tracking-[0.04em] py-px px-1.5 mx-0.5 rounded-sm border border-redact-border align-[1px]"
          >
            {match[1]}
          </span>
        );
      })}
    </span>
  );
}

/**
 * The PII Sovereign Guardrail demo page. Lets a reviewer type a prompt,
 * run it through the masking pipeline (real deployed flow, or local
 * Layer-1-only demo mode if none is deployed), and see both the masked
 * payload that would leave the infrastructure and the rehydrated
 * response returned to the caller.
 */
export default function Page() {
  const [rawPrompt, setRawPrompt] = useState(EXAMPLE_PROMPT);
  const [targetModel, setTargetModel] = useState(MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GuardrailResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const res = await runGuardrail(rawPrompt, targetModel);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-[1080px] mx-auto px-6 pt-14 pb-24">
      <div className="font-mono text-xs tracking-[0.12em] text-accent mb-2.5">
        LAMATIC AGENTKIT · SECURITY LAYER
      </div>
      <h1 className="text-[40px] leading-[1.15] mb-3 font-[650] tracking-[-0.01em]">
        PII Sovereign Guardrail
      </h1>
      <p className="text-text-dim text-base max-w-[620px] mb-10">
        PII is masked in two layers before it reaches the target model
        you're protecting against. Everything under a bar below is what
        actually reached that model — restored only in the final response.
      </p>

      <div className="grid grid-cols-2 gap-5">
        {/* Input panel */}
        <div className="bg-panel border border-border rounded-lg p-5">
          <label
            htmlFor="raw-prompt"
            className="block font-mono text-[11px] tracking-[0.08em] text-text-dim mb-2"
          >
            RAW PROMPT — STAYS LOCAL
          </label>
          <textarea
            id="raw-prompt"
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            rows={7}
            className="w-full bg-panel-raised border border-border rounded-md text-text font-mono text-[13.5px] p-3 resize-y"
          />

          <div className="flex justify-between items-center mt-3.5">
            <select
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
              aria-label="Select target model"
              className="bg-panel-raised border border-border text-text rounded-md py-2 px-2.5 font-mono text-[12.5px]"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <button
              onClick={handleRun}
              disabled={loading || !rawPrompt.trim()}
              className={`bg-accent text-accent-fg border-none rounded-md py-2.5 px-[18px] font-semibold text-[13.5px] ${
                loading ? "cursor-default opacity-60" : "cursor-pointer opacity-100"
              }`}
            >
              {loading ? "Masking…" : "Run guardrail"}
            </button>
          </div>
        </div>

        {/* Output panel */}
        <div className="bg-panel border border-border rounded-lg p-5">
          <label className="block font-mono text-[11px] tracking-[0.08em] text-text-dim mb-2">
            WHAT ACTUALLY LEFT YOUR INFRASTRUCTURE
          </label>
          <div
            className={`bg-panel-raised border border-border rounded-md p-3 font-mono text-[13.5px] min-h-[140px] ${
              result ? "text-text" : "text-text-dim"
            }`}
          >
            {result ? (
              <RedactedText text={result.maskedPromptSent} />
            ) : (
              "Run the guardrail to see the masked payload."
            )}
          </div>

          {result && (
            <>
              <div className="flex gap-4 my-4 font-mono text-xs text-text-dim">
                <span>
                  total masked: <b className="text-accent">{result.tokensRedacted.total}</b>
                </span>
                <span>deterministic: {result.tokensRedacted.deterministic}</span>
                <span>probabilistic: {result.tokensRedacted.probabilistic}</span>
                {result.demoMode && (
                  <span className="text-redact">demo mode — no flow deployed yet</span>
                )}
              </div>

              <label className="block font-mono text-[11px] tracking-[0.08em] text-text-dim mb-2">
                REHYDRATED RESPONSE — RETURNED TO CALLER
              </label>
              <div className="bg-panel-raised border border-border rounded-md p-3 font-mono text-[13.5px] whitespace-pre-wrap">
                {result.secureResponse}
              </div>
            </>
          )}

          {error && <div className="text-redact mt-3">{error}</div>}
        </div>
      </div>
    </main>
  );
}