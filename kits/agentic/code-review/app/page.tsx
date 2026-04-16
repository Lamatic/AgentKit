"use client"

import { type FormEvent, type HTMLAttributes, type ReactNode, useState } from "react"

type Finding = { line: string; issue: string; severity: string }
type StyleItem = string | { suggestion?: string; issue?: string }
type ReviewResult = {
  summary: string
  bugs: Finding[]
  security: Finding[]
  style: StyleItem[]
}

type ReviewApiResponse = {
  error?: string
  summary?: string
  bugs?: Finding[]
  security?: Finding[]
  style?: StyleItem[]
}

export default function Home() {
  const [owner, setOwner] = useState("")
  const [repo, setRepo] = useState("")
  const [prNumber, setPrNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [error, setError] = useState("")

  async function handleReview() {
    if (!owner || !repo || !prNumber) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, pr_number: prNumber }),
      })

      const raw = await res.text()
      const trimmed = raw.trim()
      let data: ReviewApiResponse | null = null

      if (trimmed) {
        try {
          data = JSON.parse(trimmed)
        } catch {
          data = null
        }
      }

      if (!res.ok) {
        if (typeof data?.error === "string" && data.error) {
          throw new Error(data.error)
        }

        if (trimmed.startsWith("<")) {
          throw new Error(
            `The review API returned HTML instead of JSON (status ${res.status}). The server route likely failed before it could return a structured response.`
          )
        }

        throw new Error(`Review request failed with status ${res.status}.`)
      }

      if (!data || typeof data !== "object") {
        throw new Error(
          "The review API returned an invalid response. The server may be failing before it can send JSON."
        )
      }

      setResult({
        summary: typeof data.summary === "string" ? data.summary : "",
        bugs: Array.isArray(data.bugs) ? data.bugs : [],
        security: Array.isArray(data.security) ? data.security : [],
        style: Array.isArray(data.style) ? data.style : [],
      })
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "The review request failed.")
    } finally {
      setLoading(false)
    }
  }

  const bugCount = result?.bugs?.length ?? 0
  const securityCount = result?.security?.length ?? 0
  const styleCount = result?.style?.length ?? 0
  const target = owner && repo ? `${owner}/${repo}` : "owner/repo"
  const pull = prNumber ? `#${prNumber}` : "#PR"

  return (
    <>
      <main className="cr-page">
        <div className="cr-bg cr-bg-one" />
        <div className="cr-bg cr-bg-two" />
        <div className="cr-grid" />

        <div className="cr-shell">
          <section className="cr-hero">
            <span className="cr-eyebrow">AI Pull Request Review</span>
            <h1>Elegant PR reviews, shaped like a modern developer tool.</h1>
            <p>
              Code Review Agent keeps the same Lamatic-backed review flow and
              re-presents the output as a cleaner summary plus triage-ready bug,
              security, and style cards.
            </p>
            <div className="cr-pills">
              <span className="cr-pill">
                <strong>Endpoint</strong>
                <code>/api/review</code>
              </span>
              <span className="cr-pill">
                <strong>Output</strong>
                <span>Summary · Bugs · Security · Style</span>
              </span>
              <span className="cr-pill">
                <strong>Target</strong>
                <code>{target} {pull}</code>
              </span>
            </div>
          </section>

          <section className="cr-panel">
            <div className="cr-panel-head">
              <div>
                <span className="cr-section-label">Review Input</span>
                <h2>Analyze a GitHub pull request</h2>
              </div>
              <span className="cr-live">Live Flow</span>
            </div>

            <form
              className="cr-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault()
                void handleReview()
              }}
            >
              <Field className="owner" label="Owner" placeholder="vercel" value={owner} onChange={setOwner} />
              <Field className="repo" label="Repository" placeholder="next.js" value={repo} onChange={setRepo} />
              <Field
                className="pr"
                label="PR Number"
                placeholder="12345"
                value={prNumber}
                onChange={setPrNumber}
                inputMode="numeric"
              />
              <div className="action">
                <button className="cr-button" type="submit" disabled={loading || !owner || !repo || !prNumber}>
                  {loading ? (
                    <>
                      <span className="cr-spinner" />
                      Reviewing
                    </>
                  ) : (
                    <>
                      <span className="cr-button-dot" />
                      Review PR
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="cr-help">
              <span>Three inputs in, structured findings out.</span>
              <span className="cr-help-dot" />
              <span>API behavior is unchanged.</span>
            </div>
          </section>

          {error ? (
            <div className="cr-error" role="alert">
              <span>Request failed</span>
              <p>{error}</p>
            </div>
          ) : null}

          {loading ? (
            <LoadingState />
          ) : result ? (
            <section className="cr-results">
              <div className="cr-stats">
                <StatCard label="Findings surfaced" value={String(bugCount + securityCount + styleCount)} accent="#f8fafc" />
                <StatCard label="Bug risks" value={String(bugCount)} accent="#ff7b72" />
                <StatCard label="Security notes" value={String(securityCount)} accent="#f6c177" />
                <StatCard label="Style suggestions" value={String(styleCount)} accent="#9bb3ff" />
              </div>

              <section className="cr-summary">
                <div className="cr-summary-glow" />
                <div className="cr-summary-head">
                  <div>
                    <span className="cr-section-label">Summary</span>
                    <h2>PR overview</h2>
                  </div>
                  <div className="cr-summary-tags">
                    <span>{target}</span>
                    <span>{pull}</span>
                  </div>
                </div>
                <p>{result.summary || "No high-level summary was returned for this pull request."}</p>
              </section>

              <div className="cr-card-grid">
                <ResultCard title="Bugs" description="Logic defects, correctness issues, and runtime risk." count={bugCount} accent="#ff7b72">
                  {bugCount ? (
                    result.bugs.map((item, index) => <FindingItem key={`bug-${index}-${item.line}`} finding={item} accent="#ff7b72" />)
                  ) : (
                    <div className="cr-empty-card">No bug-level issues were flagged in this review.</div>
                  )}
                </ResultCard>

                <ResultCard title="Security" description="Unsafe patterns, validation gaps, and attack surface." count={securityCount} accent="#f6c177">
                  {securityCount ? (
                    result.security.map((item, index) => <FindingItem key={`security-${index}-${item.line}`} finding={item} accent="#f6c177" />)
                  ) : (
                    <div className="cr-empty-card">No security issues were surfaced in this review.</div>
                  )}
                </ResultCard>

                <ResultCard title="Style" description="Readability, consistency, and maintainability notes." count={styleCount} accent="#9bb3ff">
                  {styleCount ? (
                    result.style.map((item, index) => (
                      <StyleSuggestionCard
                        key={`style-${index}`}
                        text={typeof item === "string" ? item : item?.suggestion || item?.issue || "Style suggestion returned."}
                      />
                    ))
                  ) : (
                    <div className="cr-empty-card">No style suggestions were returned for this review.</div>
                  )}
                </ResultCard>
              </div>
            </section>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      <style jsx global>{`
        .cr-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at top, rgba(30, 41, 59, 0.36), transparent 38%), #050816;
          color: #f8fafc;
          font-family: "Sohne", "IBM Plex Sans", "Segoe UI", sans-serif;
        }
        .cr-page * { box-sizing: border-box; }
        .cr-bg, .cr-grid { pointer-events: none; position: absolute; }
        .cr-bg { width: 26rem; height: 26rem; border-radius: 999px; filter: blur(120px); }
        .cr-bg-one { top: -8rem; left: -8rem; background: rgba(59, 130, 246, 0.18); }
        .cr-bg-two { top: 7rem; right: -10rem; background: rgba(251, 191, 36, 0.12); }
        .cr-grid {
          inset: 0;
          opacity: .28;
          background-image:
            linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(circle at center, black 30%, transparent 78%);
        }
        .cr-shell {
          position: relative;
          z-index: 1;
          max-width: 1200px;
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
          color: #cbd5e1;
        }
        .cr-hero { max-width: 900px; display: flex; flex-direction: column; gap: 18px; }
        .cr-hero h1 {
          margin: 0;
          max-width: 820px;
          font-size: clamp(2.4rem, 5vw, 4.3rem);
          line-height: 1.03;
          letter-spacing: -.05em;
        }
        .cr-hero p, .cr-summary p, .cr-empty p { margin: 0; color: #94a3b8; line-height: 1.8; }
        .cr-hero p { max-width: 760px; font-size: 18px; }
        .cr-pills, .cr-help, .cr-summary-tags { display: flex; flex-wrap: wrap; gap: 10px; }
        .cr-pill, .cr-summary-tags span {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.14);
          background: rgba(8,12,24,.72);
        }
        .cr-pill strong { color: #64748b; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
        .cr-pill code { font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace; }
        .cr-panel, .cr-empty, .cr-summary, .cr-card, .cr-loading-banner, .cr-stat, .cr-error {
          background: rgba(8,12,24,.78);
          border: 1px solid rgba(148,163,184,.14);
          box-shadow: 0 24px 60px rgba(2,6,23,.35), inset 0 1px 0 rgba(255,255,255,.04);
        }
        .cr-panel, .cr-empty, .cr-summary { border-radius: 28px; }
        .cr-panel { padding: 24px; backdrop-filter: blur(20px); }
        .cr-panel-head, .cr-summary-head, .cr-card-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .cr-panel-head h2, .cr-summary h2 { margin: 8px 0 0; letter-spacing: -.04em; }
        .cr-panel-head h2 { font-size: 24px; }
        .cr-live {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(110,231,183,.22);
          background: rgba(16,185,129,.08);
          color: #a7f3d0;
        }
        .cr-form {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 14px;
          align-items: end;
          margin-top: 20px;
        }
        .cr-field { display: flex; flex-direction: column; gap: 8px; }
        .cr-field span { color: #94a3b8; font-size: 13px; font-weight: 500; }
        .cr-field.owner, .cr-field.repo { grid-column: span 4; }
        .cr-field.pr, .cr-form .action { grid-column: span 2; }
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
        .cr-input::placeholder { color: #64748b; }
        .cr-input:focus {
          border-color: rgba(126,156,255,.72);
          box-shadow: 0 0 0 4px rgba(94,129,255,.12);
          background: rgba(10,15,27,.94);
        }
        .cr-button {
          width: 100%;
          min-height: 56px;
          border: none;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(99,102,241,.96), rgba(59,130,246,.96));
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 18px 40px rgba(79,102,255,.22);
          transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease;
        }
        .cr-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 22px 46px rgba(79,102,255,.3); }
        .cr-button:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }
        .cr-button-dot, .cr-help-dot, .cr-stat-dot, .cr-find-dot, .cr-style-dot {
          width: 8px; height: 8px; border-radius: 999px; flex: 0 0 auto;
        }
        .cr-button-dot { background: rgba(255,255,255,.92); box-shadow: 0 0 14px rgba(255,255,255,.68); }
        .cr-help { margin-top: 18px; align-items: center; color: #94a3b8; font-size: 13px; }
        .cr-help-dot { background: rgba(148,163,184,.5); width: 4px; height: 4px; }
        .cr-error { border-radius: 20px; padding: 16px 18px; background: rgba(68,10,10,.45); border-color: rgba(248,113,113,.32); }
        .cr-error span { color: #fca5a5; }
        .cr-error p { margin: 8px 0 0; color: #fecaca; line-height: 1.6; }
        .cr-results { display: flex; flex-direction: column; gap: 18px; }
        .cr-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }
        .cr-stat {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 18px;
        }
        .cr-stat-dot { position: absolute; top: 16px; right: 16px; }
        .cr-stat strong { display: block; font-size: 28px; line-height: 1; letter-spacing: -.04em; }
        .cr-stat span { display: block; margin-top: 10px; color: #94a3b8; font-size: 13px; }
        .cr-summary {
          position: relative;
          overflow: hidden;
          padding: 28px;
          border-color: rgba(129,140,248,.18);
          background: linear-gradient(135deg, rgba(17,24,39,.94), rgba(8,12,24,.92));
        }
        .cr-summary-glow {
          position: absolute;
          width: 260px;
          height: 260px;
          right: -40px;
          top: -120px;
          border-radius: 999px;
          background: rgba(99,102,241,.18);
          filter: blur(60px);
        }
        .cr-summary h2 { position: relative; font-size: 28px; }
        .cr-summary p { position: relative; max-width: 90ch; font-size: 18px; color: #e2e8f0; }
        .cr-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        .cr-card {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cr-card-line { position: absolute; inset: 0 0 auto; height: 2px; }
        .cr-card-head h3 { margin: 0; font-size: 20px; letter-spacing: -.03em; }
        .cr-card-head p { margin: 8px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; }
        .cr-count {
          min-width: 34px;
          height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(15,23,42,.46);
          border: 1px solid rgba(148,163,184,.16);
          font-size: 13px;
          font-weight: 700;
        }
        .cr-card-body { display: flex; flex-direction: column; gap: 12px; }
        .cr-finding, .cr-style, .cr-empty-card {
          border-radius: 18px;
          padding: 14px 14px 16px;
          border: 1px solid rgba(148,163,184,.12);
          background: rgba(15,23,42,.55);
        }
        .cr-find-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 12px;
        }
        .cr-find-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .cr-find-line, .cr-pill code, .cr-summary-tags span {
          font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
        }
        .cr-find-line {
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(15,23,42,.4);
          color: #cbd5e1;
          font-size: 12px;
        }
        .cr-badge {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .cr-finding p, .cr-style p { margin: 0; color: #e2e8f0; font-size: 14px; line-height: 1.75; }
        .cr-style { display: flex; gap: 12px; align-items: flex-start; }
        .cr-style-dot { margin-top: 8px; background: #9bb3ff; box-shadow: 0 0 16px rgba(155,179,255,.8); }
        .cr-empty-card {
          border-style: dashed;
          background: rgba(15,23,42,.22);
          color: #94a3b8;
          line-height: 1.7;
        }
        .cr-empty { padding: 28px; display: flex; flex-direction: column; gap: 18px; }
        .cr-empty h2 { margin: 0; font-size: 28px; letter-spacing: -.04em; }
        .cr-empty-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .cr-preview {
          border-radius: 20px;
          padding: 18px;
          background: rgba(15,23,42,.5);
          border: 1px solid rgba(148,163,184,.12);
        }
        .cr-preview-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #7dd3fc;
          box-shadow: 0 0 18px rgba(125,211,252,.75);
        }
        .cr-preview h3 { margin: 16px 0 8px; font-size: 18px; letter-spacing: -.02em; }
        .cr-preview p { color: #94a3b8; font-size: 14px; line-height: 1.7; }
        .cr-loading-banner {
          border-radius: 24px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cr-loading-banner strong { display: block; margin-top: 6px; font-size: 18px; letter-spacing: -.02em; }
        .cr-spinner {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 2px solid rgba(255,255,255,.24);
          border-top-color: #fff;
          animation: cr-spin .8s linear infinite;
        }
        .cr-skeleton {
          position: relative;
          overflow: hidden;
          background: rgba(255,255,255,.05);
        }
        .cr-skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.11), transparent);
          animation: cr-shimmer 1.7s ease-in-out infinite;
        }
        @keyframes cr-spin { to { transform: rotate(360deg); } }
        @keyframes cr-shimmer { 100% { transform: translateX(100%); } }
        @media (max-width: 1100px) {
          .cr-field.owner, .cr-field.repo { grid-column: span 6; }
          .cr-field.pr, .cr-form .action { grid-column: span 6; }
          .cr-card-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 720px) {
          .cr-shell { padding: 56px 18px 80px; }
          .cr-field.owner, .cr-field.repo, .cr-field.pr, .cr-form .action { grid-column: span 12; }
          .cr-summary, .cr-panel, .cr-empty { padding: 22px; }
          .cr-hero p, .cr-summary p { font-size: 16px; }
        }
      `}</style>
    </>
  )
}

function Field({
  className,
  label,
  placeholder,
  value,
  onChange,
  inputMode,
}: {
  className: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  return (
    <label className={`cr-field ${className}`}>
      <span>{label}</span>
      <input className="cr-input" placeholder={placeholder} value={value} inputMode={inputMode} onChange={event => onChange(event.target.value)} />
    </label>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="cr-stat">
      <span className="cr-stat-dot" style={{ background: accent, boxShadow: `0 0 18px ${accent}` }} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ResultCard({
  title,
  description,
  count,
  accent,
  children,
}: {
  title: string
  description: string
  count: number
  accent: string
  children: ReactNode
}) {
  return (
    <section className="cr-card">
      <div className="cr-card-line" style={{ background: accent }} />
      <div className="cr-card-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="cr-count">{count}</span>
      </div>
      <div className="cr-card-body">{children}</div>
    </section>
  )
}

function FindingItem({ finding, accent }: { finding: Finding; accent: string }) {
  const badge = severityTone(finding.severity)
  return (
    <article className="cr-finding">
      <div className="cr-find-head">
        <div className="cr-find-meta">
          <span className="cr-find-dot" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
          <span className="cr-badge" style={badge}>
            {finding.severity || "Unknown"}
          </span>
        </div>
        <span className="cr-find-line">Line {finding.line || "?"}</span>
      </div>
      <p>{finding.issue}</p>
    </article>
  )
}

function StyleSuggestionCard({ text }: { text: string }) {
  return (
    <article className="cr-style">
      <span className="cr-style-dot" />
      <p>{text}</p>
    </article>
  )
}

function EmptyState() {
  return (
    <section className="cr-empty">
      <span className="cr-section-label">Ready</span>
      <h2>The review surface is standing by.</h2>
      <p>
        Enter a GitHub owner, repository, and pull request number to render the
        review in a more structured workspace.
      </p>
      <div className="cr-empty-grid">
        <Preview title="Summary first" text="A prominent overview card gives the PR narrative room to breathe before the detailed findings." />
        <Preview title="Severity-aware triage" text="Critical and high issues read differently from medium and low ones, so prioritization is immediate." />
        <Preview title="Polished feedback loop" text="Loading mirrors the final layout with motion and skeleton cards instead of a blank waiting state." />
      </div>
    </section>
  )
}

function Preview({ title, text }: { title: string; text: string }) {
  return (
    <div className="cr-preview">
      <div className="cr-preview-dot" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <section className="cr-results">
      <div className="cr-loading-banner">
        <span className="cr-spinner" />
        <div>
          <span className="cr-section-label">Review In Progress</span>
          <strong>Scanning the pull request and assembling findings</strong>
        </div>
      </div>
      <div className="cr-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="cr-stat" key={`stat-${index}`}>
            <div className="cr-skeleton" style={{ width: "42%", height: 28, borderRadius: 10 }} />
            <div className="cr-skeleton" style={{ width: "72%", height: 14, borderRadius: 10, marginTop: 12 }} />
          </div>
        ))}
      </div>
      <section className="cr-summary">
        <div className="cr-skeleton" style={{ width: "32%", height: 14, borderRadius: 999, position: "relative" }} />
        <div className="cr-skeleton" style={{ width: "84%", height: 18, borderRadius: 10, marginTop: 18, position: "relative" }} />
        <div className="cr-skeleton" style={{ width: "95%", height: 18, borderRadius: 10, marginTop: 14, position: "relative" }} />
        <div className="cr-skeleton" style={{ width: "78%", height: 18, borderRadius: 10, marginTop: 14, position: "relative" }} />
      </section>
      <div className="cr-card-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <section className="cr-card" key={`card-${index}`}>
            <div className="cr-skeleton" style={{ width: "48%", height: 18, borderRadius: 10 }} />
            <div className="cr-skeleton" style={{ width: "100%", height: 78, borderRadius: 18 }} />
            <div className="cr-skeleton" style={{ width: "100%", height: 78, borderRadius: 18 }} />
            <div className="cr-skeleton" style={{ width: "82%", height: 78, borderRadius: 18 }} />
          </section>
        ))}
      </div>
    </section>
  )
}

function severityTone(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical":
      return { background: "rgba(239,68,68,.2)", color: "#fecaca", border: "1px solid rgba(248,113,113,.38)" }
    case "high":
      return { background: "rgba(248,113,113,.15)", color: "#fca5a5", border: "1px solid rgba(248,113,113,.28)" }
    case "medium":
      return { background: "rgba(250,204,21,.16)", color: "#fde68a", border: "1px solid rgba(250,204,21,.3)" }
    case "low":
      return { background: "rgba(148,163,184,.16)", color: "#cbd5e1", border: "1px solid rgba(148,163,184,.24)" }
    default:
      return { background: "rgba(96,165,250,.16)", color: "#bfdbfe", border: "1px solid rgba(96,165,250,.24)" }
  }
}
