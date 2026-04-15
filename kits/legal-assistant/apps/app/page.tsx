"use client"

import { type FormEvent, useState } from "react"

type LegalResponse = {
  answer: string
  disclaimer: string
  jurisdiction: string
}

type LegalApiResponse = {
  error?: string
  answer?: string
  disclaimer?: string
  jurisdiction?: string
}

export default function LegalAssistantPage() {
  const [question, setQuestion] = useState("")
  const [jurisdiction, setJurisdiction] = useState("")
  const [context, setContext] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LegalResponse | null>(null)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!question.trim()) {
      setError("Please enter a legal question before submitting.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, jurisdiction, context }),
      })

      const raw = await res.text()
      const trimmed = raw.trim()
      let data: LegalApiResponse | null = null

      if (trimmed) {
        try {
          data = JSON.parse(trimmed) as LegalApiResponse
        } catch {
          data = null
        }
      }

      if (!res.ok) {
        if (typeof data?.error === "string" && data.error) {
          throw new Error(data.error)
        }

        throw new Error(`Legal assistant request failed with status ${res.status}.`)
      }

      if (!data || typeof data.answer !== "string") {
        throw new Error("The legal assistant returned an invalid response.")
      }

      setResult({
        answer: data.answer,
        disclaimer:
          typeof data.disclaimer === "string" && data.disclaimer
            ? data.disclaimer
            : "Informational only, not legal advice.",
        jurisdiction:
          typeof data.jurisdiction === "string" && data.jurisdiction
            ? data.jurisdiction
            : "Unspecified",
      })
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The legal assistant request failed."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="cr-page">
        <div className="cr-bg cr-bg-one" />
        <div className="cr-bg cr-bg-two" />
        <div className="cr-grid" />

        <div className="cr-shell">
          <section className="cr-hero">
            <span className="cr-eyebrow">Lamatic Legal Assistant</span>
            <h1>Legal research, without pretending to be your lawyer.</h1>
            <p>
              Ask jurisdiction-specific questions against your Lamatic-connected
              legal corpus and get an informational answer that pushes for citations,
              practical next steps, and a clear non-advice disclaimer.
            </p>
            <div className="cr-pills">
              <span className="cr-pill">
                <strong>Route</strong>
                <code>/api/legal</code>
              </span>
              <span className="cr-pill">
                <strong>Flow</strong>
                <span>RAG chat over legal materials</span>
              </span>
              <span className="cr-pill">
                <strong>Jurisdiction</strong>
                <span>{jurisdiction.trim() || "Unspecified"}</span>
              </span>
            </div>
          </section>

          <section className="cr-panel">
            <div className="cr-panel-head">
              <div>
                <span className="cr-section-label">Intake</span>
                <h2>Frame the legal issue</h2>
              </div>
              <span className="cr-live">Informational Only</span>
            </div>

            <form className="cr-form" onSubmit={handleSubmit}>
              <label className="cr-field jurisdiction">
                <span>Jurisdiction</span>
                <input
                  className="cr-input"
                  value={jurisdiction}
                  placeholder="California, England and Wales, EU, federal..."
                  onChange={(event) => setJurisdiction(event.target.value)}
                />
              </label>

              <label className="cr-field context">
                <span>Context</span>
                <textarea
                  className="cr-input cr-textarea"
                  value={context}
                  placeholder="Facts, timeline, parties, procedural posture, or contract language."
                  onChange={(event) => setContext(event.target.value)}
                />
              </label>

              <label className="cr-field question">
                <span>Legal Question</span>
                <textarea
                  className="cr-input cr-textarea"
                  value={question}
                  placeholder="What notice is typically required before terminating this lease for non-payment?"
                  onChange={(event) => setQuestion(event.target.value)}
                />
              </label>

              <div className="action">
                <button
                  className="cr-button"
                  type="submit"
                  disabled={loading || !question.trim()}
                >
                  {loading ? "Researching..." : "Analyze Issue"}
                </button>
              </div>
            </form>

            <div className="cr-help">
              <span>Best results come from a Lamatic flow connected to statutes, cases, or internal legal memos.</span>
              <span className="cr-help-dot" />
              <span>The UI always keeps the non-advice framing visible.</span>
            </div>
          </section>

          {error ? (
            <div className="cr-error" role="alert">
              <span>Request failed</span>
              <p>{error}</p>
            </div>
          ) : null}

          {result ? (
            <section className="cr-results">
              <section className="cr-answer">
                <div className="cr-answer-head">
                  <div>
                    <span className="cr-section-label">Answer</span>
                    <h2>Research response</h2>
                  </div>
                  <div className="cr-answer-meta">
                    <span>{result.jurisdiction}</span>
                  </div>
                </div>
                <p className="cr-answer-copy">{result.answer}</p>
              </section>

              <section className="cr-disclaimer">
                <span className="cr-section-label">Disclaimer</span>
                <p>{result.disclaimer}</p>
              </section>
            </section>
          ) : (
            <section className="cr-empty">
              <span className="cr-section-label">Workflow</span>
              <h2>Point the assistant at your legal corpus, then ask a real question.</h2>
              <p>
                This kit is meant for legal research support, not legal advice. Import the
                bundled Lamatic flow, connect it to your legal knowledge base, and use the
                jurisdiction and context fields to narrow the answer.
              </p>
            </section>
          )}
        </div>
      </main>

      <style jsx global>{`
        .cr-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at top, rgba(101, 67, 33, 0.24), transparent 32%), #0b0f19;
          color: #f8fafc;
          font-family: "Sohne", "IBM Plex Sans", "Segoe UI", sans-serif;
        }
        .cr-page * { box-sizing: border-box; }
        .cr-bg, .cr-grid { pointer-events: none; position: absolute; }
        .cr-bg { width: 26rem; height: 26rem; border-radius: 999px; filter: blur(120px); }
        .cr-bg-one { top: -8rem; left: -8rem; background: rgba(180, 83, 9, 0.18); }
        .cr-bg-two { top: 7rem; right: -10rem; background: rgba(217, 119, 6, 0.14); }
        .cr-grid {
          inset: 0;
          opacity: .22;
          background-image:
            linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(circle at center, black 30%, transparent 78%);
        }
        .cr-shell {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 72px 24px 96px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .cr-eyebrow, .cr-section-label, .cr-live, .cr-error span {
          text-transform: uppercase;
          letter-spacing: .08em;
          font-size: 12px;
          font-weight: 700;
        }
        .cr-eyebrow {
          width: fit-content;
          padding: 8px 12px;
          border: 1px solid rgba(148,163,184,.14);
          border-radius: 999px;
          background: rgba(15,23,42,.65);
          color: #e2e8f0;
        }
        .cr-hero { max-width: 860px; display: flex; flex-direction: column; gap: 18px; }
        .cr-hero h1 {
          margin: 0;
          font-size: clamp(2.4rem, 5vw, 4.2rem);
          line-height: 1.03;
          letter-spacing: -.05em;
        }
        .cr-hero p, .cr-empty p, .cr-answer p, .cr-disclaimer p {
          margin: 0;
          color: #b8c4d6;
          line-height: 1.8;
        }
        .cr-hero p { font-size: 18px; max-width: 760px; }
        .cr-pills, .cr-help, .cr-answer-meta { display: flex; flex-wrap: wrap; gap: 10px; }
        .cr-pill, .cr-answer-meta span {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.14);
          background: rgba(8,12,24,.72);
        }
        .cr-pill strong {
          color: #94a3b8;
          font-size: 12px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .cr-pill code { font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace; }
        .cr-panel, .cr-empty, .cr-answer, .cr-disclaimer, .cr-error {
          background: rgba(8,12,24,.8);
          border: 1px solid rgba(148,163,184,.14);
          box-shadow: 0 24px 60px rgba(2,6,23,.35), inset 0 1px 0 rgba(255,255,255,.04);
          border-radius: 28px;
        }
        .cr-panel, .cr-answer, .cr-disclaimer, .cr-empty { padding: 24px; backdrop-filter: blur(18px); }
        .cr-panel-head, .cr-answer-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .cr-panel-head h2, .cr-answer h2, .cr-empty h2 { margin: 8px 0 0; letter-spacing: -.04em; }
        .cr-live {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(251,191,36,.22);
          background: rgba(217,119,6,.08);
          color: #fde68a;
        }
        .cr-form {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 14px;
          align-items: end;
          margin-top: 20px;
        }
        .cr-field { display: flex; flex-direction: column; gap: 8px; }
        .cr-field span { color: #cbd5e1; font-size: 13px; font-weight: 500; }
        .cr-field.jurisdiction { grid-column: span 4; }
        .cr-field.context { grid-column: span 8; }
        .cr-field.question, .cr-form .action { grid-column: span 12; }
        .cr-input {
          width: 100%;
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(7,11,20,.82);
          color: #f8fafc;
          border-radius: 16px;
          padding: 16px 18px;
          font-size: 15px;
          outline: none;
          transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
        }
        .cr-textarea {
          min-height: 132px;
          resize: vertical;
          font-family: inherit;
        }
        .cr-input::placeholder { color: #64748b; }
        .cr-input:focus {
          border-color: rgba(217,119,6,.72);
          box-shadow: 0 0 0 4px rgba(217,119,6,.12);
          background: rgba(10,15,27,.94);
        }
        .cr-button {
          width: 100%;
          min-height: 56px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(180, 83, 9, .96), rgba(217, 119, 6, .96));
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 18px 40px rgba(180,83,9,.22);
          transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease;
        }
        .cr-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 22px 46px rgba(180,83,9,.28); }
        .cr-button:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }
        .cr-help {
          margin-top: 18px;
          align-items: center;
          color: #94a3b8;
          font-size: 13px;
        }
        .cr-help-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(148,163,184,.5);
        }
        .cr-error { padding: 16px 18px; background: rgba(68,10,10,.45); border-color: rgba(248,113,113,.32); }
        .cr-error span { color: #fca5a5; }
        .cr-error p { margin: 8px 0 0; color: #fecaca; }
        .cr-results { display: flex; flex-direction: column; gap: 16px; }
        .cr-answer-copy { white-space: pre-wrap; }
        .cr-disclaimer {
          background: rgba(30, 41, 59, .72);
          border-style: dashed;
        }
        .cr-empty { max-width: 860px; display: flex; flex-direction: column; gap: 14px; }
        @media (max-width: 960px) {
          .cr-field.jurisdiction, .cr-field.context, .cr-field.question, .cr-form .action { grid-column: span 12; }
          .cr-shell { padding-top: 56px; }
        }
        @media (max-width: 640px) {
          .cr-shell { padding: 36px 16px 72px; }
          .cr-panel, .cr-answer, .cr-disclaimer, .cr-empty { border-radius: 22px; padding: 20px; }
          .cr-hero p { font-size: 16px; }
        }
      `}</style>
    </>
  )
}
