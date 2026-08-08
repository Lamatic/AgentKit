"use client";

import { useState } from "react";
import { runGuardrail, type GuardrailResult } from "../actions/orchestrate";

const EXAMPLE_PROMPT =
  "Hi, this is John Whitfield. My email is john.whitfield@acme-corp.com and my number is (415) 555-0192. Can you draft a reply to my landlord about the lease at 42 Elm Street, Austin?";

const MODELS = ["gpt-4o-mini", "gpt-4o", "claude-sonnet-4-6"];

function RedactedText({ text }: { text: string }) {
  // Splits on [REDACTED_TYPE_n] placeholders and renders them as literal
  // redaction bars — the signature visual for this kit. Nothing under a
  // bar left the building in its real form.
  const parts = text.split(/(\[REDACTED_[A-Z_]+_\d+\])/g);
  return (
    <span style={{ lineHeight: 1.7 }}>
      {parts.map((part, i) => {
        const match = part.match(/^\[REDACTED_([A-Z_]+)_\d+\]$/);
        if (!match) return <span key={i}>{part}</span>;
        return (
          <span
            key={i}
            title={match[1].replace(/_/g, " ")}
            style={{
              display: "inline-block",
              background: "var(--redact-bar)",
              color: "var(--redact)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72em",
              letterSpacing: "0.04em",
              padding: "1px 6px",
              margin: "0 2px",
              borderRadius: 2,
              border: "1px solid #2a1712",
              verticalAlign: "1px"
            }}
          >
            {match[1]}
          </span>
        );
      })}
    </span>
  );
}

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
    <main
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "56px 24px 96px"
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.12em",
          color: "var(--accent)",
          marginBottom: 10
        }}
      >
        LAMATIC AGENTKIT · SECURITY LAYER
      </div>
      <h1
        style={{
          fontSize: 40,
          lineHeight: 1.15,
          margin: "0 0 12px",
          fontWeight: 650,
          letterSpacing: "-0.01em"
        }}
      >
        PII Sovereign Guardrail
      </h1>
      <p
        style={{
          color: "var(--text-dim)",
          fontSize: 16,
          maxWidth: 620,
          margin: "0 0 40px"
        }}
      >
        Raw personal data never leaves your infrastructure. Everything
        under a bar below is masked before it reaches an external model,
        and restored only in the final response.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20
        }}
      >
        {/* Input panel */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 20
          }}
        >
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--text-dim)",
              marginBottom: 8
            }}
          >
            RAW PROMPT — STAYS LOCAL
          </label>
          <textarea
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            rows={7}
            style={{
              width: "100%",
              background: "var(--panel-raised)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text)",
              fontFamily: "var(--font-mono)",
              fontSize: 13.5,
              padding: 12,
              resize: "vertical"
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14
            }}
          >
            <select
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
              style={{
                background: "var(--panel-raised)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: 6,
                padding: "8px 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 12.5
              }}
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
              style={{
                background: "var(--accent)",
                color: "#04150f",
                border: "none",
                borderRadius: 6,
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: 13.5,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Masking…" : "Run guardrail"}
            </button>
          </div>
        </div>

        {/* Output panel */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 20
          }}
        >
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--text-dim)",
              marginBottom: 8
            }}
          >
            WHAT ACTUALLY LEFT YOUR INFRASTRUCTURE
          </label>
          <div
            style={{
              background: "var(--panel-raised)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 12,
              fontFamily: "var(--font-mono)",
              fontSize: 13.5,
              minHeight: 140,
              color: result ? "var(--text)" : "var(--text-dim)"
            }}
          >
            {result ? (
              <RedactedText text={result.maskedPromptSent} />
            ) : (
              "Run the guardrail to see the masked payload."
            )}
          </div>

          {result && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  margin: "16px 0",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--text-dim)"
                }}
              >
                <span>
                  total masked:{" "}
                  <b style={{ color: "var(--accent)" }}>
                    {result.tokensRedacted.total}
                  </b>
                </span>
                <span>
                  deterministic: {result.tokensRedacted.deterministic}
                </span>
                <span>
                  probabilistic: {result.tokensRedacted.probabilistic}
                </span>
                {result.demoMode && (
                  <span style={{ color: "var(--redact)" }}>
                    demo mode — no flow deployed yet
                  </span>
                )}
              </div>

              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: "var(--text-dim)",
                  marginBottom: 8
                }}
              >
                REHYDRATED RESPONSE — RETURNED TO CALLER
              </label>
              <div
                style={{
                  background: "var(--panel-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 12,
                  fontFamily: "var(--font-mono)",
                  fontSize: 13.5,
                  whiteSpace: "pre-wrap"
                }}
              >
                {result.secureResponse}
              </div>
            </>
          )}

          {error && (
            <div style={{ color: "var(--redact)", marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
